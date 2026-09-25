import type { AwardId, AwardTier } from '@mcphub/scoring';

/** Rim gradient stops, light to dark, for a metallic finish. */
type Rim = readonly [string, string, string];

/** The artwork for one badge. */
interface MedalArt {
  /** Banner text. */
  label: string;
  rim: Rim;
  /** Colour of the glow behind the icon. */
  glow: string;
  /** Lucide-style 24×24 stroke paths for the icon. */
  glyph: string[];
}

const TIER_RIMS: Record<AwardTier, Rim> = {
  bronze: ['#fde4cc', '#c2773a', '#6b3510'],
  silver: ['#f8fafc', '#a3b1c2', '#475569'],
  gold: ['#fef3c7', '#f5b40b', '#8a4b06'],
};

const LOCKED_RIM: Rim = ['#e5e7eb', '#8b95a5', '#374151'];

/** Icon paths (Lucide geometry, drawn on a 24×24 grid). */
const GLYPHS = {
  shieldCheck: [
    'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
    'm9 12 2 2 4-4',
  ],
  lock: [
    'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z',
    'M7 11V7a5 5 0 0 1 10 0v4',
  ],
  trophy: [
    'M6 9H4.5a2.5 2.5 0 0 1 0-5H6',
    'M18 9h1.5a2.5 2.5 0 0 0 0-5H18',
    'M4 22h16',
    'M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22',
    'M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22',
    'M18 2H6v7a6 6 0 0 0 12 0V2Z',
  ],
  badgeCheck: [
    'M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z',
    'm9 12 2 2 4-4',
  ],
  building: [
    'M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z',
    'M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2',
    'M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2',
    'M10 6h4',
    'M10 10h4',
    'M10 14h4',
    'M10 18h4',
  ],
  star: [
    'M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z',
  ],
  activity: [
    'M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2',
  ],
  rocket: [
    'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z',
    'm12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z',
    'M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0',
    'M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5',
  ],
} as const;

/** Art direction for every badge. Popular's rim comes from its tier. */
const ART: Record<AwardId, MedalArt> = {
  trusted: {
    label: 'TRUSTED',
    rim: ['#fef9c3', '#e3b10b', '#7c4a03'],
    glow: '#34d399',
    glyph: [...GLYPHS.shieldCheck],
  },
  'security-clean': {
    label: 'SECURE',
    rim: ['#e0f2fe', '#38bdf8', '#0b4a6f'],
    glow: '#38bdf8',
    glyph: [...GLYPHS.lock],
  },
  'top-rated': {
    label: 'TOP RATED',
    rim: ['#fff1c2', '#f59e0b', '#7c3a06'],
    glow: '#fbbf24',
    glyph: [...GLYPHS.trophy],
  },
  verified: {
    label: 'VERIFIED',
    rim: ['#cffafe', '#22d3ee', '#0e4f5c'],
    glow: '#22d3ee',
    glyph: [...GLYPHS.badgeCheck],
  },
  official: {
    label: 'OFFICIAL',
    rim: ['#e2e8f0', '#7c8db5', '#27334d'],
    glow: '#93c5fd',
    glyph: [...GLYPHS.building],
  },
  popular: {
    label: 'POPULAR',
    rim: TIER_RIMS.bronze,
    glow: '#f59e0b',
    glyph: [...GLYPHS.star],
  },
  maintained: {
    label: 'ACTIVE',
    rim: ['#dcfce7', '#4ade80', '#14532d'],
    glow: '#4ade80',
    glyph: [...GLYPHS.activity],
  },
  rising: {
    label: 'RISING',
    rim: ['#ffedd5', '#fb923c', '#7c2d12'],
    glow: '#fb923c',
    glyph: [...GLYPHS.rocket],
  },
};

/** Options for {@link renderMedal}. */
export interface MedalOptions {
  /** Popular's level; ignored for other badges. */
  tier?: AwardTier | null;
  /** Greyed out: a badge not (yet) earned. */
  locked?: boolean;
  /** Rendered width in px; height follows the 120:136 artwork. */
  size?: number;
}

/**
 * Renders a badge as a standalone SVG medal.
 *
 * A metallic hexagon with a glossy rim, a glowing field, the badge's icon and
 * a ribbon banner — collectible, like a hackathon or open-source season
 * badge. Pure string building from constants, so it is safe to inline, embed
 * in a README, or serve from an API route.
 */
export function renderMedal(award: AwardId, options: MedalOptions = {}): string {
  const art = ART[award];
  const tier = award === 'popular' ? (options.tier ?? 'bronze') : null;
  const locked = options.locked ?? false;

  const rim = locked ? LOCKED_RIM : tier ? TIER_RIMS[tier] : art.rim;
  const glow = locked ? '#64748b' : tier ? rim[1] : art.glow;
  const [light, mid, dark] = rim;
  const size = options.size ?? 120;
  const height = Math.round((size * 136) / 120);
  const title = `MCPHub ${art.label.toLowerCase()}${tier ? ` ${tier}` : ''} badge${locked ? ' (locked)' : ''}`;

  // Unique gradient ids, so several medals inlined on one page never borrow
  // each other's colours.
  const id = `m-${award}-${tier ?? 'x'}-${locked ? 'l' : 'u'}`;
  const glyph = art.glyph.map((d) => `<path d="${d}"/>`).join('');
  const tierText = tier
    ? `<text x="60" y="84" text-anchor="middle" font-family="Inter,'Segoe UI',Arial,sans-serif" font-size="6.5" font-weight="800" letter-spacing="2" fill="${light}">${tier.toUpperCase()}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${height}" viewBox="0 0 120 136" role="img" aria-label="${title}">
<title>${title}</title>
<defs>
<linearGradient id="${id}-r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${light}"/><stop offset=".5" stop-color="${mid}"/><stop offset="1" stop-color="${dark}"/></linearGradient>
<radialGradient id="${id}-f" cx=".5" cy=".4" r=".75"><stop offset="0" stop-color="${glow}" stop-opacity="${locked ? '.18' : '.5'}"/><stop offset=".55" stop-color="#0d1426"/><stop offset="1" stop-color="#060912"/></radialGradient>
<linearGradient id="${id}-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
</defs>
<path d="M36 94 28 132l13-7 8 10 4-40Z" fill="${dark}"/>
<path d="M84 94 92 132l-13-7-8 10-4-40Z" fill="${dark}"/>
<path d="M60 4 108 31v54L60 112 12 85V31Z" fill="url(#${id}-r)"/>
<path d="M60 4 108 31v22H12V31Z" fill="url(#${id}-s)" opacity=".55"/>
<path d="M60 12.5 100.5 35.5v45L60 103.5 19.5 80.5v-45Z" fill="url(#${id}-f)" stroke="#fff" stroke-opacity=".14"/>
<text x="60" y="29" text-anchor="middle" font-family="Inter,'Segoe UI',Arial,sans-serif" font-size="6" font-weight="700" letter-spacing="2.4" fill="#fff" fill-opacity=".55">MCPHUB</text>
<g transform="translate(42 36) scale(1.5)" fill="none" stroke="${locked ? '#94a3b8' : light}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"${locked ? ' opacity=".6"' : ''}>${glyph}</g>
${tierText}
<path d="M10 90h100l-6 9 6 9H10l6-9Z" fill="url(#${id}-r)" stroke="${dark}" stroke-opacity=".5"/>
<text x="60" y="102" text-anchor="middle" font-family="Inter,'Segoe UI',Arial,sans-serif" font-size="8.5" font-weight="800" letter-spacing="1.4" fill="${locked ? '#1f2937' : '#1a1206'}">${art.label}</text>
</svg>`;
}

/** The medal as a data URI, for an `<img>` with no extra request. */
export function medalDataUri(award: AwardId, options: MedalOptions = {}): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(renderMedal(award, options))}`;
}
