import { CACHE_TTL, searchQuerySchema } from '@mcphub/shared';

import { errorResponse, getClientIp, jsonResponse, parseQuery, withErrorHandling } from '@/lib/api';
import { cacheKey, cached } from '@/lib/cache';
import { searchServers } from '@/lib/queries/servers';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';

/**
 * `GET /api/search` — typeahead search for the command palette.
 *
 * Every keystroke reaches this route, so it is the most rate-limit-sensitive
 * endpoint on the site. The client debounces, and results are cached per term:
 * popular prefixes like "post" get answered from Redis rather than Postgres.
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

  const { q, limit: max } = parseQuery(searchQuerySchema, new URL(request.url));

  const results = await cached(
    cacheKey('search', { q: q.toLowerCase(), max }),
    { ttl: CACHE_TTL.search },
    () => searchServers(q, max),
  );

  return jsonResponse(
    { query: q, results },
    { sMaxAge: CACHE_TTL.search, headers: rateLimitHeaders(limit) },
  );
});
