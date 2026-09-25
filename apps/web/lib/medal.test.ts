import { AWARD_IDS } from '@mcphub/scoring';
import { describe, expect, it } from 'vitest';

import { medalDataUri, renderMedal } from './medal';

describe('renderMedal', () => {
  it('renders every badge as a labelled SVG', () => {
    for (const id of AWARD_IDS) {
      const svg = renderMedal(id);
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg).toContain('role="img"');
      expect(svg).toContain('MCPHUB');
    }
  });

  it('shows the Popular tier on the medal and in its title', () => {
    const gold = renderMedal('popular', { tier: 'gold' });
    expect(gold).toContain('>GOLD<');
    expect(gold).toContain('popular gold badge');
  });

  it('greys out a locked badge', () => {
    const locked = renderMedal('trusted', { locked: true });
    expect(locked).toContain('(locked)');
    expect(locked).toContain('#8b95a5');
  });

  it('keeps the 120:136 proportions at any size', () => {
    expect(renderMedal('rising', { size: 60 })).toContain('width="60" height="68"');
  });
});

describe('medalDataUri', () => {
  it('encodes the SVG for use in an img src', () => {
    expect(medalDataUri('verified').startsWith('data:image/svg+xml;utf8,%3Csvg')).toBe(true);
  });
});
