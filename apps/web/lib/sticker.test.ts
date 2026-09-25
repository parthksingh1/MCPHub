import { STICKER_TIERS } from '@mcphub/scoring';
import { describe, expect, it } from 'vitest';

import { renderSticker, stickerDataUri } from './sticker';

describe('renderSticker', () => {
  it('renders every tier as a labelled SVG', () => {
    for (const tier of STICKER_TIERS) {
      const svg = renderSticker(tier);
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg).toContain('role="img"');
      expect(svg).toContain('MCPHUB');
    }
  });

  it('prints the tier threshold by default and the real score when given', () => {
    expect(renderSticker('elite')).toContain('>95+<');
    expect(renderSticker('perfect')).toContain('>100<');
    expect(renderSticker('great', { score: 86 })).toContain('>86<');
  });

  it('gives holographic tiers their sparkles', () => {
    expect(renderSticker('perfect')).toContain('opacity=".9"');
    expect(renderSticker('solid')).not.toContain('opacity=".9"');
  });
});

describe('stickerDataUri', () => {
  it('encodes the SVG for use in an img src', () => {
    expect(stickerDataUri('solid').startsWith('data:image/svg+xml;utf8,%3Csvg')).toBe(true);
  });
});
