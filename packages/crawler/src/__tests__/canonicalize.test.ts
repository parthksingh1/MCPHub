import { describe, expect, it } from 'vitest';

import {
  buildSlug,
  canonicalizeRepoUrl,
  ensureUniqueSlug,
  parseGitHubUrl,
  repoDedupeKey,
  slugify,
} from '../canonicalize';

describe('parseGitHubUrl', () => {
  it('parses a plain https URL', () => {
    expect(parseGitHubUrl('https://github.com/owner/repo')).toEqual({
      owner: 'owner',
      repo: 'repo',
    });
  });

  it.each([
    ['https://github.com/owner/repo/', 'trailing slash'],
    ['https://github.com/owner/repo.git', '.git suffix'],
    ['https://www.github.com/owner/repo', 'www subdomain'],
    ['http://github.com/owner/repo', 'plain http'],
    ['git+https://github.com/owner/repo.git', 'npm git+ prefix'],
    ['git://github.com/owner/repo.git', 'git protocol'],
    ['git@github.com:owner/repo.git', 'ssh remote'],
    ['ssh://git@github.com/owner/repo.git', 'ssh url'],
    ['github.com/owner/repo', 'no scheme'],
    ['owner/repo', 'bare shorthand'],
    ['https://github.com/owner/repo/tree/main/src', 'deep link'],
    ['  https://github.com/owner/repo  ', 'surrounding whitespace'],
  ])('normalises %s (%s)', (input) => {
    expect(parseGitHubUrl(input)).toEqual({ owner: 'owner', repo: 'repo' });
  });

  it('rejects non-GitHub hosts', () => {
    expect(parseGitHubUrl('https://gitlab.com/owner/repo')).toBeNull();
  });

  it('rejects GitHub URLs that are not repositories', () => {
    expect(parseGitHubUrl('https://github.com/features/actions')).toBeNull();
    expect(parseGitHubUrl('https://github.com/owner')).toBeNull();
  });

  it('rejects empty and malformed input', () => {
    expect(parseGitHubUrl('')).toBeNull();
    expect(parseGitHubUrl('not a url at all')).toBeNull();
    expect(parseGitHubUrl('http://')).toBeNull();
  });

  it('preserves owner and repo casing', () => {
    expect(parseGitHubUrl('https://github.com/Owner/Repo')).toEqual({
      owner: 'Owner',
      repo: 'Repo',
    });
  });
});

describe('canonicalizeRepoUrl', () => {
  it('reduces every spelling to one canonical form', () => {
    const spellings = [
      'https://github.com/modelcontextprotocol/servers',
      'https://github.com/modelcontextprotocol/servers/',
      'git+https://github.com/modelcontextprotocol/servers.git',
      'git@github.com:modelcontextprotocol/servers.git',
      'https://www.github.com/modelcontextprotocol/servers/tree/main',
    ];

    const canonical = spellings.map((url) => canonicalizeRepoUrl(url));

    expect(new Set(canonical).size).toBe(1);
    expect(canonical[0]).toBe('https://github.com/modelcontextprotocol/servers');
  });

  it('returns null for a non-repository URL', () => {
    expect(canonicalizeRepoUrl('https://example.com')).toBeNull();
  });
});

describe('repoDedupeKey', () => {
  it('treats differently cased URLs as the same repository', () => {
    expect(repoDedupeKey('https://github.com/Owner/Repo')).toBe('owner/repo');
    expect(repoDedupeKey('https://github.com/owner/repo')).toBe('owner/repo');
  });

  it('returns null for an unparseable URL', () => {
    expect(repoDedupeKey('nonsense')).toBeNull();
  });
});

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('GitHub MCP Server')).toBe('github-mcp-server');
  });

  it('collapses runs of separators', () => {
    expect(slugify('a___b   c')).toBe('a-b-c');
  });

  it('trims leading and trailing separators', () => {
    expect(slugify('--hello--')).toBe('hello');
  });

  it('strips diacritics', () => {
    expect(slugify('Café Señor')).toBe('cafe-senor');
  });

  it('caps length without leaving a trailing hyphen', () => {
    const slug = slugify('a'.repeat(200));
    expect(slug.length).toBeLessThanOrEqual(96);
    expect(slug.endsWith('-')).toBe(false);
  });
});

describe('buildSlug', () => {
  it('uses the repository name when it is distinctive', () => {
    expect(buildSlug({ owner: 'someone', repo: 'postgres-mcp-server' })).toBe(
      'postgres-mcp-server',
    );
  });

  it('prefixes the owner for a generic repository name', () => {
    expect(buildSlug({ owner: 'Anthropic', repo: 'servers' })).toBe('anthropic-servers');
    expect(buildSlug({ owner: 'acme', repo: 'mcp' })).toBe('acme-mcp');
  });

  it('prefixes the owner for a very short repository name', () => {
    expect(buildSlug({ owner: 'acme', repo: 'db' })).toBe('acme-db');
  });
});

describe('ensureUniqueSlug', () => {
  it('returns the slug unchanged when it is free', () => {
    const taken = new Set<string>();
    expect(ensureUniqueSlug('github', taken)).toBe('github');
    expect(taken.has('github')).toBe(true);
  });

  it('appends an incrementing suffix on collision', () => {
    const taken = new Set(['github']);
    expect(ensureUniqueSlug('github', taken)).toBe('github-2');
    expect(ensureUniqueSlug('github', taken)).toBe('github-3');
  });

  it('throws rather than looping forever when the space is exhausted', () => {
    const taken = new Set(['x']);
    for (let i = 2; i < 1000; i += 1) taken.add(`x-${i}`);

    expect(() => ensureUniqueSlug('x', taken)).toThrow(/unique slug/i);
  });
});
