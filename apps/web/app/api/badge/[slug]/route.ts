import { computeAwards, getTrustBand, isScanClean } from '@mcphub/scoring';
import { CACHE_TTL, TRUST_MAX_TOTAL, serverSecuritySchema } from '@mcphub/shared';

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
 * `?type=trusted` shows the MCPHub Trusted badge when earned.
 * `?style=flat|flat-square|for-the-badge` picks the look, mirroring Shields.io
 * so the badge can match whatever else is in the README.
 */
export async function GET(request: Request, context: RouteContext): Promise<Response> {
  const { slug } = await context.params;
  const params = new URL(request.url).searchParams;
  const style = parseBadgeStyle(params.get('style'));
  // `?type=trusted` shows the MCPHub Trusted badge once earned and falls back
  // to the score until then, so a maintainer can embed it once and forget it.
  const wantsTrusted = params.get('type') === 'trusted';

  let svg: string;

  try {
    const server = await cached(
      cacheKey('badge-v2', { slug }),
      { ttl: CACHE_TTL.detail },
      async () => {
        const row = await getServerBySlug(slug);
        if (!row) return null;
        const scan = serverSecuritySchema.safeParse(row.security);
        const awards = computeAwards({
          trustTotal: row.trustTotal,
          trustPrevious: row.trustPrevious,
          lastCommitAt: row.lastCommitAt,
          license: row.license,
          githubStars: row.githubStars,
          isOfficial: row.isOfficial,
          verified: row.verified,
          deprecated: row.deprecated,
          scanClean: isScanClean(scan.success ? scan.data : null),
        });
        return {
          trustTotal: row.trustTotal,
          deprecated: row.deprecated,
          trusted: awards.includes('trusted'),
        };
      },
    );

    if (!server) {
      svg = renderBadge('mcphub', 'not indexed', BADGE_COLOURS.unknown, style);
    } else if (server.deprecated) {
      svg = renderBadge('mcphub', 'deprecated', BADGE_COLOURS.low, style);
    } else if (wantsTrusted && server.trusted) {
      svg = renderBadge('mcphub', '✓ trusted', BADGE_COLOURS.high, style);
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
