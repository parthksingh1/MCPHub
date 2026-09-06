import { TRUST_BANDS } from '@mcphub/shared';

/** Qualitative band a Trust Score falls into, used for colour coding. */
export type TrustBand = 'high' | 'medium' | 'low';

/**
 * Maps a 0-100 Trust Score onto its band.
 * Kept next to the algorithm so the UI and the score can never drift apart.
 */
export function getTrustBand(total: number): TrustBand {
  if (total >= TRUST_BANDS.high) return 'high';
  if (total >= TRUST_BANDS.medium) return 'medium';
  return 'low';
}

/** Human-readable label for a Trust Score band. */
export function getTrustLabel(total: number): string {
  const band = getTrustBand(total);
  if (band === 'high') return 'Trusted';
  if (band === 'medium') return 'Reasonable';
  return 'Use with caution';
}
