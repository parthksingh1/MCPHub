import { getTrustBand } from '@mcphub/scoring';
import { CACHE_TTL, TRUST_MAX_TOTAL } from '@mcphub/shared';

import { BADGE_COLOURS, parseBadgeStyle, renderBadge } from '@/lib/badge';
import { cacheKey, cached } from '@/lib/cache';
import { getServerBySlug } from '@/lib/queries/servers';

/** Route params for a single server. */
interface RouteContext {
  params: Promise<{ slug: string }>;
}

/**
 * `GET /api/badge/[slug]` — an embeddable Trust Score badge.
 *
 * Always returns 200 with an SVG, even for an unknown slug: a broken image in
 * someone's README reflects on MCPHub, and "unknown" is more useful to a
 * reader than a missing image icon.
 *
 * `?style=flat|flat-square|for-the-badge` picks the look, mirroring Shields.io
 * so the badge can match whatever else is in the README.
 */
export async function GET(request: Request, context: RouteContext): Promise<Response> {
  const { slug } = await context.params;
  const style = parseBadgeStyle(new URL(request.url).searchParams.get('style'));

  let svg: string;

  try {
    const server = await cached(
      cacheKey('badge', { slug }),
      { ttl: CACHE_TTL.detail },
      async () => {
        const row = await getServerBySlug(slug);
        return row ? { trustTotal: row.trustTotal, deprecated: row.deprecated } : null;
      },
    );

    if (!server) {
      svg = renderBadge('mcphub', 'not indexed', BADGE_COLOURS.unknown, style);
    } else if (server.deprecated) {
      svg = renderBadge('mcphub', 'deprecated', BADGE_COLOURS.low, style);
    } else {
      svg = renderBadge(
        'trust score',
        `${server.trustTotal}/${TRUST_MAX_TOTAL}`,
        BADGE_COLOURS[getTrustBand(server.trustTotal)],
        style,
      );
    }
  } catch {
    svg = renderBadge('mcphub', 'unavailable', BADGE_COLOURS.unknown, style);
  }

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      // GitHub proxies README images through Camo, which caches aggressively
      // on its own. A long s-maxage keeps MCPHub's origin out of the loop.
      'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
