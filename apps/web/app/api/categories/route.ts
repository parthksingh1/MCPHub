import { CACHE_TTL } from '@mcphub/shared';

import { jsonResponse, withErrorHandling } from '@/lib/api';
import { cacheKey, cached } from '@/lib/cache';
import { getCategoryCounts } from '@/lib/queries/servers';

/** `GET /api/categories` — every category with its live server count. */
export const GET = withErrorHandling(async () => {
  const categories = await cached(cacheKey('categories'), { ttl: CACHE_TTL.category }, () =>
    getCategoryCounts(),
  );

  return jsonResponse({ categories }, { sMaxAge: CACHE_TTL.category });
});
