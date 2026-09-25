/**
 * Score stickers: a collectible sticker for every server that scores well.
 *
 * Separate from the badges. Badges reward specific qualities (a clean scan,
 * popularity, being official); a sticker simply celebrates the overall Trust
 * Score, one tier per band, from Solid up to a holographic Perfect 100.
 */

/** Sticker tiers, best first. */
export const STICKER_TIERS = ['perfect', 'elite', 'excellent', 'great', 'solid'] as const;

export type StickerTier = (typeof STICKER_TIERS)[number];

/** Public description of a sticker tier and the score that earns it. */
export interface StickerDefinition {
  tier: StickerTier;
  label: string;
  /** Lowest Trust Score in the tier. */
  minScore: number;
  criteria: string;
}

export const STICKERS: Record<StickerTier, StickerDefinition> = {
  perfect: {
    tier: 'perfect',
    label: 'Perfect',
    minScore: 100,
    criteria: 'A flawless Trust Score of 100.',
  },
  elite: { tier: 'elite', label: 'Elite', minScore: 95, criteria: 'Trust Score of 95 to 99.' },
  excellent: {
    tier: 'excellent',
    label: 'Excellent',
    minScore: 90,
    criteria: 'Trust Score of 90 to 94.',
  },
  great: { tier: 'great', label: 'Great', minScore: 80, criteria: 'Trust Score of 80 to 89.' },
  solid: { tier: 'solid', label: 'Solid', minScore: 70, criteria: 'Trust Score of 70 to 79.' },
};

/**
 * The sticker a server has earned, or null.
 *
 * Deprecated servers get none: a sticker celebrates a project, and celebrating
 * one its own author has retired would be misleading.
 */
export function scoreSticker(score: number, deprecated = false): StickerTier | null {
  if (deprecated) return null;
  return STICKER_TIERS.find((tier) => score >= STICKERS[tier].minScore) ?? null;
}
