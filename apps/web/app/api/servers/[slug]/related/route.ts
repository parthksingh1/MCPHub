import { CACHE_TTL } from '@mcphub/shared';

import { ApiException, jsonResponse, withErrorHandling } from '@/lib/api';
import { cacheKey, cached } from '@/lib/cache';
import { getRelatedServers, getServerBySlug } from '@/lib/queries/servers';

/** Route params for a single server. */
interface RouteContext {
  params: Promise<{ slug: string }>;
}

/** `GET /api/servers/[slug]/related` — six alternatives to this server. */
export const GET = withErrorHandling(async (_request: Request, context: RouteContext) => {
  const { slug } = await context.params;

  const related = await cached(
    cacheKey('related', { slug }),
    { ttl: CACHE_TTL.detail },
    async () => {
      const server = await getServerBySlug(slug);
      if (!server) return null;

      return getRelatedServers(server.id, server.categories, 6);
    },
  );

  if (!related) throw new ApiException('NOT_FOUND', `No server found with slug "${slug}".`);

  return jsonResponse({ servers: related }, { sMaxAge: CACHE_TTL.detail });
});
