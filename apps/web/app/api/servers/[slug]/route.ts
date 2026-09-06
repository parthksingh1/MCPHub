import { CACHE_TTL } from '@mcphub/shared';

import { ApiException, jsonResponse, withErrorHandling } from '@/lib/api';
import { cacheKey, cached } from '@/lib/cache';
import { getServerBySlug } from '@/lib/queries/servers';

/** Route params for a single server. */
interface RouteContext {
  params: Promise<{ slug: string }>;
}

/**
 * `GET /api/servers/[slug]` — full detail for one server.
 *
 * Deprecated servers are still served here, flagged rather than hidden: their
 * pages keep working and keep their inbound links, and telling someone the
 * server they were about to install is dead is the whole point of MCPHub.
 */
export const GET = withErrorHandling(async (_request: Request, context: RouteContext) => {
  const { slug } = await context.params;

  const server = await cached(cacheKey('server', { slug }), { ttl: CACHE_TTL.detail }, () =>
    getServerBySlug(slug),
  );

  if (!server) throw new ApiException('NOT_FOUND', `No server found with slug "${slug}".`);

  return jsonResponse(server, { sMaxAge: CACHE_TTL.detail });
});
