import { STICKERS, type StickerTier } from '@mcphub/scoring';

/** The look of one sticker tier. */
interface StickerArt {
  /** Face gradient stops, top-left to bottom-right. */
  face: string[];
  /** Text colour on the face. */
  ink: string;
  /** Background of the label strip. */
  strip: string;
  sparkles: boolean;
}

const ART: Record<StickerTier, StickerArt> = {
  perfect: {
    // Holographic foil.
    face: ['#fbcfe8', '#a5f3fc', '#fde68a', '#c4b5fd', '#99f6e4'],
    ink: '#1e1b4b',
    strip: 'rgba(255,255,255,0.55)',
    sparkles: true,
  },
  elite: {
    face: ['#fef3c7', '#fbbf24', '#b45309'],
    ink: '#3b1d00',
    strip: 'rgba(255,255,255,0.45)',
    sparkles: true,
  },
  excellent: {
    face: ['#6ee7b7', '#10b981', '#065f46'],
    ink: '#ffffff',
    strip: 'rgba(0,0,0,0.2)',
    sparkles: false,
  },
  great: {
    face: ['#93c5fd', '#3b82f6', '#1e3a8a'],
    ink: '#ffffff',
    strip: 'rgba(0,0,0,0.2)',
    sparkles: false,
  },
  solid: {
    face: ['#f1f5f9', '#94a3b8', '#334155'],
    ink: '#ffffff',
    strip: 'rgba(0,0,0,0.22)',
    sparkles: false,
  },
};

/** A four-point sparkle centred on (x, y). */
function sparkle(x: number, y: number, r: number): string {
  return `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z" fill="#fff" opacity=".9"/>`;
}

/** Options for {@link renderSticker}. */
export interface StickerOptions {
  /** The actual score to print; defaults to the tier's threshold ("95+"). */
  score?: number;
  size?: number;
}

/**
 * Renders a score sticker as a standalone SVG.
 *
 * A die-cut sticker — white border, glossy face, the score in big type and a
 * label strip — in the tier's finish, from silver Solid to holographic
 * Perfect. Pure string building from constants, safe to inline or serve.
 */
export function renderSticker(tier: StickerTier, options: StickerOptions = {}): string {
  const art = ART[tier];
  const def = STICKERS[tier];
  const size = options.size ?? 160;
  const big =
    options.score !== undefined
      ? String(options.score)
      : tier === 'perfect'
        ? '100'
        : `${def.minScore}+`;
  const id = `st-${tier}-${big.replace('+', 'p')}`;
  const stops = art.face
    .map(
      (colour, index) => `<stop offset="${index / (art.face.length - 1)}" stop-color="${colour}"/>`,
    )
    .join('');
  const sparkles = art.sparkles
    ? sparkle(40, 128, 7) + sparkle(126, 36, 6) + sparkle(132, 118, 4)
    : '';
  const title = `MCPHub ${def.label} score sticker — ${big}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 160 160" role="img" aria-label="${title}">
<title>${title}</title>
<defs>
<linearGradient id="${id}-f" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient>
<linearGradient id="${id}-s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<clipPath id="${id}-c"><rect x="10" y="10" width="140" height="140" rx="33"/></clipPath>
</defs>
<rect x="2" y="2" width="156" height="156" rx="40" fill="#fff" stroke="#000" stroke-opacity=".08"/>
<rect x="10" y="10" width="140" height="140" rx="33" fill="url(#${id}-f)"/>
<g clip-path="url(#${id}-c)"><path d="M10 72 72 10h30L10 102Z" fill="url(#${id}-s)" opacity=".55"/></g>
<rect x="10.5" y="10.5" width="139" height="139" rx="32.5" fill="none" stroke="#fff" stroke-opacity=".35"/>
${sparkles}
<text x="80" y="40" text-anchor="middle" font-family="Inter,'Segoe UI',Arial,sans-serif" font-size="10" font-weight="800" letter-spacing="3" fill="${art.ink}" fill-opacity=".75">MCPHUB</text>
<text x="80" y="96" text-anchor="middle" font-family="Inter,'Segoe UI',Arial,sans-serif" font-size="46" font-weight="900" letter-spacing="-1.5" fill="${art.ink}">${big}</text>
<rect x="32" y="108" width="96" height="22" rx="11" fill="${art.strip}"/>
<text x="80" y="123.5" text-anchor="middle" font-family="Inter,'Segoe UI',Arial,sans-serif" font-size="11" font-weight="800" letter-spacing="2" fill="${art.ink}">${def.label.toUpperCase()}</text>
</svg>`;
}

/** The sticker as a data URI, for an `<img>` with no extra request. */
export function stickerDataUri(tier: StickerTier, options: StickerOptions = {}): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(renderSticker(tier, options))}`;
}
