import { describe, expect, it } from 'vitest';

import { pageWindow } from './pagination';

describe('pageWindow', () => {
  it('shows every page when there are only a few', () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(2, 4)).toEqual([1, 2, 3, 4]);
  });

  it('shows first, last and the neighbours of the current page', () => {
    expect(pageWindow(7, 224)).toEqual([1, 'gap', 6, 7, 8, 'gap', 224]);
  });

  it('handles the ends of the range', () => {
    expect(pageWindow(1, 224)).toEqual([1, 2, 'gap', 224]);
    expect(pageWindow(224, 224)).toEqual([1, 'gap', 223, 224]);
  });

  it('fills a single skipped page instead of showing a gap', () => {
    expect(pageWindow(4, 10)).toEqual([1, 2, 3, 4, 5, 'gap', 10]);
  });
});
