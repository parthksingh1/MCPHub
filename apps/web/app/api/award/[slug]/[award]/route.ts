import {
  AWARD_IDS,
  computeAwards,
  isScanClean,
  popularTier,
  type AwardId,
  type AwardTier,
} from '@mcphub/scoring';
import { CACHE_TTL, serverSecuritySchema } from '@mcphub/shared';

import { cacheKey, cached } from '@/lib/cache';
import { renderMedal } from '@/lib/medal';
import { getServerBySlug } from '@/lib/queries/servers';

/** Route params: the server and which badge. */
interface RouteContext {
  params: Promise<{ slug: string; award: string }>;
}

/**
 * `GET /api/award/[slug]/[award]` — an embeddable medal for a README.
 *
 * The medal is shown in colour only if that server has earned it right now;
 * otherwise the locked version is served. A maintainer therefore cannot embed
 * a badge they have not earned, and a medal disappears if it is lost.
 */
export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  const { slug, award: rawAward } = await context.params;
  const award = rawAward.replace(/\.svg$/, '') as AwardId;

  if (!AWARD_IDS.includes(award)) {
    return new Response('Unknown badge', { status: 404 });
  }

  let state: { earned: AwardId[]; tier: AwardTier | null } | null = null;
  try {
    state = await cached(cacheKey('award', { slug }), { ttl: CACHE_TTL.detail }, async () => {
      const row = await getServerBySlug(slug);
      if (!row) return null;
      const scan = serverSecuritySchema.safeParse(row.security);
      return {
        earned: computeAwards({
          trustTotal: row.trustTotal,
          trustPrevious: row.trustPrevious,
          lastCommitAt: row.lastCommitAt,
          license: row.license,
          githubStars: row.githubStars,
          isOfficial: row.isOfficial,
          verified: row.verified,
          deprecated: row.deprecated,
          scanClean: isScanClean(scan.success ? scan.data : null),
        }),
        tier: popularTier(row.githubStars),
      };
    });
  } catch {
    state = null;
  }

  const earned = state?.earned.includes(award) ?? false;
  const svg = renderMedal(award, { tier: state?.tier ?? null, locked: !earned, size: 120 });

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      // GitHub proxies README images through Camo, which caches on its own.
      'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
