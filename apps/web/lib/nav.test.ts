import { describe, expect, it } from 'vitest';

import { EXPLORE_NAV, MAIN_NAV, RESOURCE_NAV, isNavActive } from './nav';

describe('isNavActive', () => {
  it('matches the section and anything below it', () => {
    expect(isNavActive('/servers', '/servers')).toBe(true);
    expect(isNavActive('/servers/github-mcp-server', '/servers')).toBe(true);
  });

  it('ignores query strings on the link', () => {
    expect(isNavActive('/rankings', '/rankings?view=rising')).toBe(true);
  });

  it('does not match a sibling that merely shares a prefix', () => {
    expect(isNavActive('/servers-archive', '/servers')).toBe(false);
    expect(isNavActive('/', '/servers')).toBe(false);
  });
});

describe('navigation lists', () => {
  it('keeps the header to five flat links', () => {
    expect(MAIN_NAV).toHaveLength(5);
  });

  it('has no duplicate destinations within a list', () => {
    for (const list of [MAIN_NAV, EXPLORE_NAV, RESOURCE_NAV]) {
      const hrefs = list.map((link) => link.href);
      expect(new Set(hrefs).size).toBe(hrefs.length);
    }
  });
});
