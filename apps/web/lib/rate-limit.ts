import { RATE_LIMITS } from '@mcphub/shared';
import { Ratelimit } from '@upstash/ratelimit';

import { getRedis } from './redis';

/** Which limit bucket a route belongs to. */
export type RateLimitKind = keyof typeof RATE_LIMITS;

/** Outcome of a rate-limit check. */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the caller may retry. Only meaningful when blocked. */
  retryAfter: number;
}

const limiters = new Map<RateLimitKind, Ratelimit>();

/**
 * Builds (and memoises) a limiter for one bucket.
 *
 * A sliding window rather than a fixed one: a fixed window lets a caller send
 * a full allowance at 0:59 and another at 1:00, doubling the intended rate
 * exactly at the moment of a traffic spike.
 *
 * `analytics` is deliberately off — it costs extra Upstash commands per
 * request, and the free tier allows only 10,000 commands a day in total.
 */
function getLimiter(kind: RateLimitKind): Ratelimit | null {
  const cached = limiters.get(kind);
  if (cached) return cached;

  const redis = getRedis();
  if (!redis) return null;

  const config = RATE_LIMITS[kind];
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    prefix: `mcphub:rl:${kind}`,
    analytics: false,
  });

  limiters.set(kind, limiter);
  return limiter;
}

/**
 * Checks a caller against a rate-limit bucket.
 *
 * Fails **open** when Redis is unavailable. That is a deliberate trade: the
 * limiter exists to protect the database from casual abuse, and letting
 * legitimate traffic through during a Redis outage is better than returning
 * 429 to everyone. Cloudflare sits in front and handles genuine attacks.
 */
export async function checkRateLimit(
  kind: RateLimitKind,
  identifier: string,
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[kind];
  const limiter = getLimiter(kind);

  if (!limiter) {
    return { success: true, limit: config.requests, remaining: config.requests, retryAfter: 0 };
  }

  try {
    const result = await limiter.limit(identifier);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      retryAfter: Math.max(0, Math.ceil((result.reset - Date.now()) / 1000)),
    };
  } catch {
    return { success: true, limit: config.requests, remaining: config.requests, retryAfter: 0 };
  }
}

/** Standard rate-limit headers, so clients can back off intelligently. */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
  };

  if (!result.success) headers['Retry-After'] = String(result.retryAfter);

  return headers;
}
