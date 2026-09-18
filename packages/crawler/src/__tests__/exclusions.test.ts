import { describe, expect, it } from 'vitest';

import { isExcludedRepo } from '../exclusions';

describe('isExcludedRepo', () => {
  const list = new Set(['acme/private-mcp']);

  it('matches any URL form and case of an excluded repo', () => {
    expect(isExcludedRepo('https://github.com/acme/private-mcp', list)).toBe(true);
    expect(isExcludedRepo('https://github.com/Acme/Private-MCP.git', list)).toBe(true);
    expect(isExcludedRepo('git+https://github.com/acme/private-mcp/tree/main', list)).toBe(true);
  });

  it('leaves other repos alone', () => {
    expect(isExcludedRepo('https://github.com/acme/other', list)).toBe(false);
    expect(isExcludedRepo('not a url', list)).toBe(false);
  });
});
