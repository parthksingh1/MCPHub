import { CACHE_TTL } from '@mcphub/shared';

import { jsonResponse, withErrorHandling } from '@/lib/api';
import { cacheKey, cached } from '@/lib/cache';
import { getSiteStats } from '@/lib/queries/servers';

/** `GET /api/stats` — aggregate figures for the homepage stats bar. */
export const GET = withErrorHandling(async () => {
  const stats = await cached(cacheKey('stats'), { ttl: CACHE_TTL.stats }, () => getSiteStats());

  return jsonResponse(stats, { sMaxAge: CACHE_TTL.stats });
});
