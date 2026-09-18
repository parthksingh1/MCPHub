/** Badge styles, named after their Shields.io equivalents so they are familiar. */
export const BADGE_STYLES = ['flat', 'flat-square', 'for-the-badge'] as const;

export type BadgeStyle = (typeof BADGE_STYLES)[number];

/** Band colours, matching the Shields.io palette so badges sit together well. */
export const BADGE_COLOURS = {
  high: '#3fb950',
  medium: '#d29922',
  low: '#f85149',
  unknown: '#8b949e',
} as const;

/** Narrows an untrusted query value to a known style, defaulting to `flat`. */
export function parseBadgeStyle(value: string | null | undefined): BadgeStyle {
  return BADGE_STYLES.includes(value as BadgeStyle) ? (value as BadgeStyle) : 'flat';
}

/** Escapes text for safe inclusion in SVG character data and attributes. */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Approximate rendered width of a string.
 *
 * Slightly over-estimating is safe — it only adds padding — whereas
 * under-estimating clips the text. `for-the-badge` is uppercase, bold and
 * letter-spaced, so its glyphs run wider.
 */
function textWidth(text: string, style: BadgeStyle): number {
  return Math.ceil(text.length * (style === 'for-the-badge' ? 7.6 : 6.4));
}

/**
 * Renders a Shields.io-style badge as SVG.
 *
 * Hand-written rather than proxied to shields.io: an embedded badge is loaded
 * on every view of someone else's README, so it must be fast, must not depend
 * on a third party's uptime, and must not leak MCPHub traffic to another
 * service. It is pure string building, so it costs nothing to serve.
 */
export function renderBadge(
  label: string,
  message: string,
  colour: string,
  style: BadgeStyle = 'flat',
): string {
  const tall = style === 'for-the-badge';
  const text = (value: string): string => (tall ? value.toUpperCase() : value);

  const safeLabel = escapeXml(text(label));
  const safeMessage = escapeXml(text(message));

  const padding = tall ? 24 : 12;
  const labelWidth = textWidth(label, style) + padding;
  const messageWidth = textWidth(message, style) + padding;
  const total = labelWidth + messageWidth;
  const height = tall ? 28 : 20;
  const radius = style === 'flat' ? 3 : 0;
  const baseline = tall ? 18 : 14;

  // Only `flat` carries the subtle top-to-bottom sheen and text shadow; the
  // square styles are deliberately flat.
  const sheen =
    style === 'flat'
      ? `<linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>`
      : '';
  const sheenRect =
    style === 'flat' ? `<rect width="${total}" height="${height}" fill="url(#s)"/>` : '';
  const shadow = (x: number, value: string): string =>
    style === 'flat'
      ? `<text x="${x}" y="${baseline + 1}" fill="#010101" fill-opacity=".3">${value}</text>`
      : '';

  const font = tall
    ? 'font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="10" font-weight="bold" letter-spacing="1"'
    : 'font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11"';

  const labelX = labelWidth / 2;
  const messageX = labelWidth + messageWidth / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="${height}" role="img" aria-label="${safeLabel}: ${safeMessage}">
  <title>${safeLabel}: ${safeMessage}</title>
  ${sheen}
  <clipPath id="r"><rect width="${total}" height="${height}" rx="${radius}" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="${height}" fill="#555"/>
    <rect x="${labelWidth}" width="${messageWidth}" height="${height}" fill="${colour}"/>
    ${sheenRect}
  </g>
  <g fill="#fff" text-anchor="middle" ${font}>
    ${shadow(labelX, safeLabel)}
    <text x="${labelX}" y="${baseline}">${safeLabel}</text>
    ${shadow(messageX, safeMessage)}
    <text x="${messageX}" y="${baseline}">${safeMessage}</text>
  </g>
</svg>`;
}
