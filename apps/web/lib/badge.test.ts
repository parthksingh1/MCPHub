import { describe, expect, it } from 'vitest';

import { BADGE_COLOURS, parseBadgeStyle, renderBadge } from './badge';

describe('parseBadgeStyle', () => {
  it('accepts known styles', () => {
    expect(parseBadgeStyle('flat-square')).toBe('flat-square');
    expect(parseBadgeStyle('for-the-badge')).toBe('for-the-badge');
  });

  it('falls back to flat for anything else', () => {
    expect(parseBadgeStyle(null)).toBe('flat');
    expect(parseBadgeStyle('plastic')).toBe('flat');
    expect(parseBadgeStyle('"><script>')).toBe('flat');
  });
});

describe('renderBadge', () => {
  it('escapes label and message', () => {
    const svg = renderBadge('<a>', '"&\'', BADGE_COLOURS.high);
    expect(svg).not.toContain('<a>');
    expect(svg).toContain('&lt;a&gt;');
    expect(svg).toContain('&quot;&amp;&apos;');
  });

  it('draws flat with rounded corners at 20px', () => {
    const svg = renderBadge('trust score', '82/100', BADGE_COLOURS.high, 'flat');
    expect(svg).toContain('height="20"');
    expect(svg).toContain('rx="3"');
  });

  it('draws flat-square with square corners and no sheen', () => {
    const svg = renderBadge('trust score', '82/100', BADGE_COLOURS.high, 'flat-square');
    expect(svg).toContain('rx="0"');
    expect(svg).not.toContain('linearGradient');
  });

  it('draws for-the-badge tall and uppercase', () => {
    const svg = renderBadge('trust score', '82/100', BADGE_COLOURS.high, 'for-the-badge');
    expect(svg).toContain('height="28"');
    expect(svg).toContain('TRUST SCORE');
  });
});
