import { describe, expect, it } from 'vitest';

import { extractRepoLinks } from '../awesome-lists';
import {
  buildTags,
  deriveQualitySignals,
  inferCategories,
  inferLanguage,
  isOfficialOwner,
  looksLikeMcpServer,
} from '../classify';
import type { GitHubTreeEntry } from '../types';

/** Builds a file tree from a list of paths. */
function tree(...paths: string[]): GitHubTreeEntry[] {
  return paths.map((path) => ({ path, type: 'blob' as const }));
}

describe('inferCategories', () => {
  it('classifies a database server', () => {
    expect(inferCategories('postgres-mcp', 'Query your PostgreSQL database', [])).toContain(
      'database',
    );
  });

  it('classifies a browser automation server', () => {
    expect(inferCategories('pw-mcp', 'Playwright browser automation', [])).toContain('browser');
  });

  it('reads categories from GitHub topics', () => {
    expect(inferCategories('thing', 'no hints here', ['slack'])).toContain('communication');
  });

  it('returns at most three categories', () => {
    const categories = inferCategories(
      'everything',
      'postgres playwright slack kubernetes aws github openai notion',
      [],
    );
    expect(categories.length).toBeLessThanOrEqual(3);
  });

  it('falls back to other when nothing matches', () => {
    expect(inferCategories('mystery', 'an inscrutable widget', [])).toEqual(['other']);
  });
});

describe('inferLanguage', () => {
  it('maps known GitHub languages', () => {
    expect(inferLanguage('TypeScript')).toBe('typescript');
    expect(inferLanguage('Python')).toBe('python');
    expect(inferLanguage('C#')).toBe('csharp');
  });

  it('maps unknown languages to other', () => {
    expect(inferLanguage('Haskell')).toBe('other');
  });

  it('returns null when the language is unknown', () => {
    expect(inferLanguage(null)).toBeNull();
  });
});

describe('buildTags', () => {
  it('drops the generic MCP topics every server carries', () => {
    expect(buildTags(['mcp', 'mcp-server', 'postgres', 'claude'], null)).toEqual(['postgres']);
  });

  it('includes the language as a tag', () => {
    expect(buildTags(['postgres'], 'typescript')).toEqual(['postgres', 'typescript']);
  });

  it('does not add "other" as a language tag', () => {
    expect(buildTags(['postgres'], 'other')).toEqual(['postgres']);
  });

  it('caps the tag count', () => {
    const topics = Array.from({ length: 30 }, (_, index) => `topic${index}`);
    expect(buildTags(topics, null).length).toBeLessThanOrEqual(12);
  });
});

describe('deriveQualitySignals', () => {
  it('detects a licence file', () => {
    expect(deriveQualitySignals(tree('LICENSE'), 0, null).hasLicense).toBe(true);
    expect(deriveQualitySignals(tree('LICENSE.md'), 0, null).hasLicense).toBe(true);
    expect(deriveQualitySignals(tree('src/index.ts'), 0, null).hasLicense).toBe(false);
  });

  it('detects tests in several conventions', () => {
    expect(deriveQualitySignals(tree('tests/test_main.py'), 0, null).hasTests).toBe(true);
    expect(deriveQualitySignals(tree('src/__tests__/a.ts'), 0, null).hasTests).toBe(true);
    expect(deriveQualitySignals(tree('src/a.test.ts'), 0, null).hasTests).toBe(true);
    expect(deriveQualitySignals(tree('internal/main_test.go'), 0, null).hasTests).toBe(true);
    expect(deriveQualitySignals(tree('src/index.ts'), 0, null).hasTests).toBe(false);
  });

  it('detects CI configuration', () => {
    expect(deriveQualitySignals(tree('.github/workflows/ci.yml'), 0, null).hasCi).toBe(true);
    expect(deriveQualitySignals(tree('.gitlab-ci.yml'), 0, null).hasCi).toBe(true);
    expect(deriveQualitySignals(tree('readme.md'), 0, null).hasCi).toBe(false);
  });

  it('detects type annotations', () => {
    expect(deriveQualitySignals([], 0, 'typescript').hasTypes).toBe(true);
    expect(deriveQualitySignals(tree('src/py.typed'), 0, 'python').hasTypes).toBe(true);
    expect(deriveQualitySignals(tree('mypy.ini'), 0, 'python').hasTypes).toBe(true);
    expect(deriveQualitySignals(tree('main.py'), 0, 'python').hasTypes).toBe(false);
  });

  it('passes the README length straight through', () => {
    expect(deriveQualitySignals([], 1234, null).readmeLength).toBe(1234);
  });
});

describe('isOfficialOwner', () => {
  it('recognises first-party publishers, case-insensitively', () => {
    expect(isOfficialOwner('modelcontextprotocol')).toBe(true);
    expect(isOfficialOwner('GitHub')).toBe(true);
  });

  it('rejects everyone else', () => {
    expect(isOfficialOwner('some-person')).toBe(false);
  });
});

describe('looksLikeMcpServer', () => {
  it('accepts a repository named after the protocol', () => {
    expect(looksLikeMcpServer('postgres-mcp-server', 'Query your Postgres database', [])).toBe(
      true,
    );
    expect(looksLikeMcpServer('mcp-git', 'Git operations', [])).toBe(true);
  });

  it('accepts a repository that declares an mcp-server topic', () => {
    expect(looksLikeMcpServer('graphify', 'Turn a codebase into a graph', ['mcp-server'])).toBe(
      true,
    );
  });

  it('accepts a repository that says plainly what it is', () => {
    expect(looksLikeMcpServer('slackbot', 'An MCP server for Slack', [])).toBe(true);
    expect(looksLikeMcpServer('thing', 'A Model Context Protocol server for your notes', [])).toBe(
      true,
    );
  });

  it('accepts a generic mcp topic combined with a server claim in prose', () => {
    expect(looksLikeMcpServer('widget', 'A server exposing widgets', ['mcp'])).toBe(true);
  });

  // These are the repositories that actually surfaced from a live crawl and
  // would have made the directory look unserious.
  it('rejects large platforms that merely integrate with MCP', () => {
    expect(
      looksLikeMcpServer(
        'n8n',
        'Fair-code workflow automation platform with native AI capabilities.',
        ['automation', 'low-code', 'mcp-client', 'integrations'],
      ),
    ).toBe(false);

    expect(
      looksLikeMcpServer('kong', 'The Cloud-Native API Gateway and AI Gateway.', ['api-gateway']),
    ).toBe(false);

    expect(
      looksLikeMcpServer('LocalAI', 'The free, Open Source alternative to OpenAI.', ['ai']),
    ).toBe(false);
  });

  it('rejects a project that declares itself an MCP client', () => {
    expect(looksLikeMcpServer('mcp-cli', 'A terminal MCP client', ['mcp-client'])).toBe(false);
  });

  it('accepts a project that declares both client and server topics', () => {
    expect(looksLikeMcpServer('mcp-kit', 'Toolkit', ['mcp-client', 'mcp-server'])).toBe(true);
  });

  it('rejects awesome-lists, tutorials, and templates', () => {
    expect(looksLikeMcpServer('awesome-mcp-servers', 'A curated list of MCP servers', [])).toBe(
      false,
    );
    expect(looksLikeMcpServer('mcp-tutorial', 'Learn to build an MCP server', [])).toBe(false);
    expect(looksLikeMcpServer('mcp-template', 'A starter template for MCP servers', [])).toBe(
      false,
    );
  });

  it('rejects client-only libraries and SDKs', () => {
    expect(looksLikeMcpServer('mcp-sdk-python', 'An MCP client library', [])).toBe(false);
  });

  it('rejects anything that never mentions MCP', () => {
    expect(looksLikeMcpServer('some-tool', 'A helpful utility', [])).toBe(false);
  });
});

describe('extractRepoLinks', () => {
  it('pulls deduplicated repository links out of a Markdown list', () => {
    const markdown = [
      '- [Git](https://github.com/modelcontextprotocol/servers) — official',
      '- [Same](https://github.com/ModelContextProtocol/Servers/) — duplicate, different case',
      '- [Other](https://github.com/acme/thing.git)',
      '- [Not a repo](https://example.com/x)',
    ].join('\n');

    expect(extractRepoLinks(markdown)).toEqual([
      'https://github.com/modelcontextprotocol/servers',
      'https://github.com/acme/thing',
    ]);
  });

  it('returns an empty array for a document with no links', () => {
    expect(extractRepoLinks('# Nothing here')).toEqual([]);
  });
});
