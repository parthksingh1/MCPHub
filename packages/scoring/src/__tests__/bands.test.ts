import { describe, expect, it } from 'vitest';

import { getTrustBand, getTrustLabel } from '../bands';

describe('getTrustBand', () => {
  it('classifies 75 and above as high', () => {
    expect(getTrustBand(75)).toBe('high');
    expect(getTrustBand(100)).toBe('high');
  });

  it('classifies 50 to 74 as medium', () => {
    expect(getTrustBand(50)).toBe('medium');
    expect(getTrustBand(74)).toBe('medium');
  });

  it('classifies below 50 as low', () => {
    expect(getTrustBand(49)).toBe('low');
    expect(getTrustBand(0)).toBe('low');
  });
});

describe('getTrustLabel', () => {
  it('labels each band', () => {
    expect(getTrustLabel(90)).toBe('Trusted');
    expect(getTrustLabel(60)).toBe('Reasonable');
    expect(getTrustLabel(10)).toBe('Use with caution');
  });
});
