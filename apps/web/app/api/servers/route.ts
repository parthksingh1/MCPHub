import { CACHE_TTL, serverQuerySchema } from '@mcphub/shared';

import { getClientIp, jsonResponse, parseQuery, withErrorHandling, errorResponse } from '@/lib/api';
import { cacheKey, cached } from '@/lib/cache';
import { listServers } from '@/lib/queries/servers';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';

/**
 * `GET /api/servers` — the browse endpoint.
 *
 * Filtering, sorting, and pagination all happen in Postgres; the result is
 * cached by exact query so the common filter combinations cost one query each
 * per minute rather than one per visitor.
 */
export const GET = withErrorHandling(async (request: Request) => {
  const limit = await checkRateLimit('read', getClientIp(request));
  if (!limit.success) {
    return errorResponse(
      'RATE_LIMITED',
      'Too many requests. Please slow down.',
      undefined,
      rateLimitHeaders(limit),
    );
  }

  const query = parseQuery(serverQuerySchema, new URL(request.url));

  const page = await cached(cacheKey('servers', { ...query }), { ttl: CACHE_TTL.list }, () =>
    listServers(query),
  );

  return jsonResponse(page, {
    sMaxAge: CACHE_TTL.list,
    headers: rateLimitHeaders(limit),
  });
});
