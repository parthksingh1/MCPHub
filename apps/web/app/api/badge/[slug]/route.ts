import { getTrustBand } from '@mcphub/scoring';
import { CACHE_TTL, TRUST_MAX_TOTAL } from '@mcphub/shared';

import { cacheKey, cached } from '@/lib/cache';
import { getServerBySlug } from '@/lib/queries/servers';

/** Route params for a single server. */
interface RouteContext {
  params: Promise<{ slug: string }>;
}

/** Band colours, matching the Shields.io palette so badges sit together well. */
const BAND_COLOURS = {
  high: '#3fb950',
  medium: '#d29922',
  low: '#f85149',
  unknown: '#8b949e',
} as const;

/** Approximate rendered width of a string in the badge's 11px font. */
function textWidth(text: string): number {
  // Digits and lowercase letters average ~6.2px; uppercase and wide glyphs
  // more. Slightly over-estimating is safe — it only adds padding — whereas
  // under-estimating clips the label.
  return Math.ceil(text.length * 6.4);
}

/** Escapes text for safe inclusion in SVG character data. */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Renders a Shields.io-style badge as SVG.
 *
 * Hand-written rather than proxied to shields.io: an embedded badge is loaded
 * on every view of someone else's README, so it must be fast, must not depend
 * on a third party's uptime, and must not leak MCPHub traffic to another
 * service. It is also pure string building, so it costs nothing to serve.
 */
function renderBadge(label: string, message: string, colour: string): string {
  const labelWidth = textWidth(label) + 12;
  const messageWidth = textWidth(message) + 12;
  const total = labelWidth + messageWidth;

  const safeLabel = escapeXml(label);
  const safeMessage = escapeXml(message);

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${total}" height="20" role="img" aria-label="${safeLabel}: ${safeMessage}">
  <title>${safeLabel}: ${safeMessage}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${total}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${messageWidth}" height="20" fill="${colour}"/>
    <rect width="${total}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${safeLabel}</text>
    <text x="${labelWidth / 2}" y="14">${safeLabel}</text>
    <text x="${labelWidth + messageWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${safeMessage}</text>
    <text x="${labelWidth + messageWidth / 2}" y="14">${safeMessage}</text>
  </g>
</svg>`;
}

/**
 * `GET /api/badge/[slug]` — an embeddable Trust Score badge.
 *
 * Always returns 200 with an SVG, even for an unknown slug: a broken image in
 * someone's README reflects on MCPHub, and "unknown" is more useful to a
 * reader than a missing image icon.
 */
export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  const { slug } = await context.params;

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
      svg = renderBadge('mcphub', 'not indexed', BAND_COLOURS.unknown);
    } else if (server.deprecated) {
      svg = renderBadge('mcphub', 'deprecated', BAND_COLOURS.low);
    } else {
      svg = renderBadge(
        'trust score',
        `${server.trustTotal}/${TRUST_MAX_TOTAL}`,
        BAND_COLOURS[getTrustBand(server.trustTotal)],
      );
    }
  } catch {
    svg = renderBadge('mcphub', 'unavailable', BAND_COLOURS.unknown);
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
