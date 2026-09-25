import { describe, expect, it } from 'vitest';

import { STICKER_TIERS, STICKERS, scoreSticker } from '../stickers';

describe('scoreSticker', () => {
  it('awards each tier at its threshold', () => {
    expect(scoreSticker(100)).toBe('perfect');
    expect(scoreSticker(99)).toBe('elite');
    expect(scoreSticker(95)).toBe('elite');
    expect(scoreSticker(94)).toBe('excellent');
    expect(scoreSticker(90)).toBe('excellent');
    expect(scoreSticker(89)).toBe('great');
    expect(scoreSticker(80)).toBe('great');
    expect(scoreSticker(79)).toBe('solid');
    expect(scoreSticker(70)).toBe('solid');
  });

  it('gives no sticker below 70', () => {
    expect(scoreSticker(69)).toBeNull();
    expect(scoreSticker(0)).toBeNull();
  });

  it('gives no sticker to deprecated servers', () => {
    expect(scoreSticker(100, true)).toBeNull();
  });

  it('defines tiers from best to worst with falling thresholds', () => {
    const thresholds = STICKER_TIERS.map((tier) => STICKERS[tier].minScore);
    expect([...thresholds].sort((a, b) => b - a)).toEqual(thresholds);
  });
});
