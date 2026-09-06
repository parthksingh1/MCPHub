import { Redis } from '@upstash/redis';

/**
 * A minimal key-value interface, so callers never care whether they are
 * talking to Upstash or to the in-process fallback.
 */
export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  /** Sets only if absent. Returns true when this caller won the race. */
  setIfAbsent(key: string, value: string, ttlSeconds: number): Promise<boolean>;
  del(key: string): Promise<void>;
}

/** One entry in the in-memory fallback cache. */
interface MemoryEntry {
  value: unknown;
  expiresAt: number;
}

/**
 * Bounded in-process LRU, used when Upstash is unreachable or unconfigured.
 *
 * This is the graceful-degradation path: losing Redis should make the site
 * slower and less consistent between serverless instances, not take it down.
 * The size cap matters because a serverless instance that caches without
 * bound eventually gets OOM-killed, turning a cache outage into an outage.
 */
class MemoryStore implements CacheStore {
  private readonly entries = new Map<string, MemoryEntry>();

  constructor(private readonly maxEntries = 1000) {}

  /** Drops the entry if it has expired. Returns whether it is still live. */
  private isLive(key: string, entry: MemoryEntry): boolean {
    if (entry.expiresAt > Date.now()) return true;

    this.entries.delete(key);
    return false;
  }

  /** Reads a value, or null when missing or expired. */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.entries.get(key);
    if (!entry || !this.isLive(key, entry)) return null;

    // Re-insert to mark as recently used; Map preserves insertion order.
    this.entries.delete(key);
    this.entries.set(key, entry);

    return entry.value as T;
  }

  /** Writes a value, evicting the least recently used entry if full. */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (this.entries.size >= this.maxEntries && !this.entries.has(key)) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }

    this.entries.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  /** Sets only if absent. */
  async setIfAbsent(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    const entry = this.entries.get(key);
    if (entry && this.isLive(key, entry)) return false;

    await this.set(key, value, ttlSeconds);
    return true;
  }

  /** Removes an entry. */
  async del(key: string): Promise<void> {
    this.entries.delete(key);
  }
}

/**
 * Upstash-backed store that falls back to memory on any failure.
 *
 * Every method swallows transport errors on purpose. A cache is an
 * optimisation; if it starts throwing, the correct behaviour is to serve the
 * page from Postgres, not to return a 500. The failure is still counted so a
 * genuinely broken Redis is visible rather than silent.
 */
class UpstashStore implements CacheStore {
  private readonly fallback = new MemoryStore();
  private consecutiveFailures = 0;

  constructor(private readonly redis: Redis) {}

  /**
   * True once Redis has failed repeatedly.
   *
   * After a handful of failures we stop trying for a while: on a serverless
   * platform every attempt costs latency on a request a user is waiting for,
   * and hammering a dead endpoint helps nobody.
   */
  private get isTripped(): boolean {
    return this.consecutiveFailures >= 5;
  }

  /** Records the outcome of a Redis call for the circuit breaker. */
  private record(ok: boolean): void {
    this.consecutiveFailures = ok ? 0 : this.consecutiveFailures + 1;
  }

  /** Reads a value, falling back to the in-process cache on failure. */
  async get<T>(key: string): Promise<T | null> {
    if (this.isTripped) return this.fallback.get<T>(key);

    try {
      const value = await this.redis.get<T>(key);
      this.record(true);
      return value ?? null;
    } catch {
      this.record(false);
      return this.fallback.get<T>(key);
    }
  }

  /** Writes a value to Redis, mirroring into memory on failure. */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (this.isTripped) return this.fallback.set(key, value, ttlSeconds);

    try {
      await this.redis.set(key, value, { ex: ttlSeconds });
      this.record(true);
    } catch {
      this.record(false);
      await this.fallback.set(key, value, ttlSeconds);
    }
  }

  /** Distributed set-if-absent, used for the stampede lock. */
  async setIfAbsent(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    if (this.isTripped) return this.fallback.setIfAbsent(key, value, ttlSeconds);

    try {
      const result = await this.redis.set(key, value, { nx: true, ex: ttlSeconds });
      this.record(true);
      return result === 'OK';
    } catch {
      this.record(false);
      return this.fallback.setIfAbsent(key, value, ttlSeconds);
    }
  }

  /** Removes an entry from both layers. */
  async del(key: string): Promise<void> {
    await this.fallback.del(key);
    if (this.isTripped) return;

    try {
      await this.redis.del(key);
      this.record(true);
    } catch {
      this.record(false);
    }
  }
}

const globalForCache = globalThis as typeof globalThis & {
  __mcphubCache?: CacheStore;
  __mcphubRedis?: Redis | null;
};

/**
 * Returns the shared cache store.
 *
 * Falls back to a pure in-memory cache when Upstash is not configured, so a
 * fresh clone runs with no external services at all.
 */
export function getCache(): CacheStore {
  if (globalForCache.__mcphubCache) return globalForCache.__mcphubCache;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  globalForCache.__mcphubCache =
    url && token ? new UpstashStore(new Redis({ url, token })) : new MemoryStore();

  return globalForCache.__mcphubCache;
}

/**
 * Returns the raw Upstash client, or null when unconfigured.
 * Only the rate limiter needs this; everything else should use {@link getCache}.
 */
export function getRedis(): Redis | null {
  if (globalForCache.__mcphubRedis !== undefined) return globalForCache.__mcphubRedis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  globalForCache.__mcphubRedis = url && token ? new Redis({ url, token }) : null;
  return globalForCache.__mcphubRedis;
}
