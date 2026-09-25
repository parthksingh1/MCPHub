import { describe, expect, it } from 'vitest';

import { languageColor, languageLabel } from './language-colors';

describe('languageLabel', () => {
  it('uses the proper name for known languages', () => {
    expect(languageLabel('typescript')).toBe('TypeScript');
    expect(languageLabel('JavaScript')).toBe('JavaScript');
    expect(languageLabel('csharp')).toBe('C#');
  });

  it('capitalises unknown languages', () => {
    expect(languageLabel('elixir')).toBe('Elixir');
  });
});

describe('languageColor', () => {
  it('returns GitHub colours for known languages, grey otherwise', () => {
    expect(languageColor('typescript')).toBe('#3178c6');
    expect(languageColor('brainfuck')).toBe('#8b949e');
    expect(languageColor(null)).toBe('#8b949e');
  });
});
