import { isLaunchMode } from './env';
import { getCache } from './redis';

/** A cached payload plus the metadata needed to serve it stale. */
interface CacheEnvelope<T> {
  value: T;
  /** Unix ms at which the value stops being fresh. */
  freshUntil: number;
}

/** Options for {@link cached}. */
export interface CacheOptions {
  /** Seconds the value is considered fresh. */
  ttl: number;
  /**
   * Extra seconds the stale value may still be served while a single caller
   * refreshes it. Defaults to ten minutes.
   */
  staleFor?: number;
}

/** How long a refresh lock is held before another caller may take over. */
const LOCK_TTL_SECONDS = 30;

/**
 * Multiplier applied to every TTL when the launch-day switch is on.
 *
 * Product Hunt and Hacker News traffic arrives as a spike, not a ramp. Holding
 * values five times longer trades freshness — which nobody notices on launch
 * day — for a fifth of the database load, which is the difference between the
 * free tier coping and the site being down for the only hours that matter.
 */
const LAUNCH_MODE_TTL_MULTIPLIER = 5;

/**
 * Reads through a shared cache, with stale-while-revalidate and stampede
 * protection.
 *
 * The stampede case is the one that actually breaks a free-tier site: when a
 * popular key expires under load, every concurrent request misses at once and
 * they all hit Postgres together. Here the first caller to claim a short lock
 * refreshes the value; everyone else keeps serving the stale copy. That turns
 * a thundering herd into exactly one query.
 *
 * If no stale value exists — a genuine cold start — all callers do compute it,
 * which is correct: there is nothing else to serve.
 */
export async function cached<T>(
  key: string,
  options: CacheOptions,
  compute: () => Promise<T>,
): Promise<T> {
  const store = getCache();

  const multiplier = isLaunchMode() ? LAUNCH_MODE_TTL_MULTIPLIER : 1;
  const ttl = options.ttl * multiplier;
  const staleFor = (options.staleFor ?? 600) * multiplier;

  const envelope = await store.get<CacheEnvelope<T>>(key);

  if (envelope) {
    if (Date.now() < envelope.freshUntil) return envelope.value;

    // Stale but usable. Try to claim the right to refresh it.
    const gotLock = await store.setIfAbsent(`${key}:lock`, '1', LOCK_TTL_SECONDS);

    if (!gotLock) return envelope.value;

    try {
      const value = await compute();
      await store.set(key, { value, freshUntil: Date.now() + ttl * 1000 }, ttl + staleFor);
      return value;
    } catch {
      // The refresh failed. Stale data beats an error page, so serve what we
      // have and let the next request try again once the lock expires.
      return envelope.value;
    } finally {
      await store.del(`${key}:lock`);
    }
  }

  const value = await compute();
  await store.set(key, { value, freshUntil: Date.now() + ttl * 1000 }, ttl + staleFor);

  return value;
}

/**
 * Builds a stable cache key from a route name and its parameters.
 *
 * Parameters are sorted so `?a=1&b=2` and `?b=2&a=1` share one entry, and
 * empty values are dropped so a blank filter does not fragment the cache.
 */
export function cacheKey(namespace: string, params: Record<string, unknown> = {}): string {
  const parts = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}=${Array.isArray(value) ? [...value].sort().join('|') : value}`)
    .sort();

  return parts.length > 0 ? `mcphub:${namespace}:${parts.join(':')}` : `mcphub:${namespace}`;
}

/** Drops a cached entry, e.g. after a write invalidates it. */
export async function invalidate(key: string): Promise<void> {
  await getCache().del(key);
}
