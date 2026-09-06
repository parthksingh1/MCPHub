import { describe, expect, it } from 'vitest';

import {
  extractDescription,
  extractInstallCommands,
  extractNpmPackage,
  extractPypiPackage,
  extractToolNames,
  extractTransports,
  parseReadme,
} from '../parse-readme';

describe('extractDescription', () => {
  it('takes the first substantial prose paragraph', () => {
    const readme = [
      '# My Server',
      '',
      '![badge](https://img.shields.io/badge/a-b.svg)',
      '',
      'An MCP server that exposes your PostgreSQL database to Claude, with read-only queries.',
      '',
      '## Installation',
    ].join('\n');

    expect(extractDescription(readme)).toBe(
      'An MCP server that exposes your PostgreSQL database to Claude, with read-only queries.',
    );
  });

  it('skips headings, badges, and code fences', () => {
    const readme = ['# Title', '```bash', 'npm install thing', '```', '', 'Short.'].join('\n');
    expect(extractDescription(readme)).toBeNull();
  });

  it('truncates on a word boundary and appends an ellipsis', () => {
    const readme = `${'word '.repeat(100)}end`;
    const description = extractDescription(readme, 60);

    expect(description).not.toBeNull();
    expect(description!.length).toBeLessThanOrEqual(61);
    expect(description!.endsWith('…')).toBe(true);
    expect(description).not.toMatch(/\s…$/);
  });

  it('returns null for an empty README', () => {
    expect(extractDescription('')).toBeNull();
  });

  it('skips a table-of-contents preamble', () => {
    const readme = [
      'Table of contents with several entries listed out for navigation purposes here',
      '',
      'This server bridges the Model Context Protocol to your local filesystem safely.',
    ].join('\n');

    expect(extractDescription(readme)).toMatch(/^This server bridges/);
  });
});

describe('extractNpmPackage', () => {
  it('reads a scoped package from an npx invocation', () => {
    expect(extractNpmPackage('npx -y @modelcontextprotocol/server-github')).toBe(
      '@modelcontextprotocol/server-github',
    );
  });

  it('reads a package from npm install', () => {
    expect(extractNpmPackage('npm install -g mcp-server-sqlite')).toBe('mcp-server-sqlite');
  });

  it('reads a package from pnpm add', () => {
    expect(extractNpmPackage('pnpm add mcp-thing')).toBe('mcp-thing');
  });

  it('returns null when no package is documented', () => {
    expect(extractNpmPackage('just some prose')).toBeNull();
  });
});

describe('extractPypiPackage', () => {
  it('reads a package from uvx', () => {
    expect(extractPypiPackage('uvx mcp-server-git')).toBe('mcp-server-git');
  });

  it('reads a package from pip install', () => {
    expect(extractPypiPackage('pip install mcp-server-fetch')).toBe('mcp-server-fetch');
  });

  it('returns null when no package is documented', () => {
    expect(extractPypiPackage('no python here')).toBeNull();
  });
});

describe('extractTransports', () => {
  it('detects stdio', () => {
    expect(extractTransports('Runs over stdio by default.')).toEqual(['stdio']);
  });

  it('detects sse', () => {
    expect(extractTransports('Supports SSE for remote use.')).toContain('sse');
  });

  it('detects streamable http', () => {
    expect(extractTransports('Use streamable HTTP to connect.')).toContain('http');
  });

  it('defaults to stdio when nothing is stated', () => {
    expect(extractTransports('A server with no transport docs.')).toEqual(['stdio']);
  });
});

describe('extractToolNames', () => {
  it('reads a bulleted tools section', () => {
    const readme = [
      '## Tools',
      '',
      '- `read_file` — reads a file',
      '- `write_file` — writes a file',
      '- **list_directory** lists entries',
      '',
      '## Licence',
      '- not_a_tool',
    ].join('\n');

    expect(extractToolNames(readme)).toEqual(['read_file', 'write_file', 'list_directory']);
  });

  it('returns an empty array when there is no tools section', () => {
    expect(extractToolNames('# Server\n\nNo tools documented.')).toEqual([]);
  });
});

describe('extractInstallCommands', () => {
  it('associates a JSON config block with the client named above it', () => {
    const readme = [
      '### Claude Desktop',
      '',
      'Add this to `claude_desktop_config.json`:',
      '',
      '```json',
      '{ "mcpServers": { "git": { "command": "uvx", "args": ["mcp-server-git"] } } }',
      '```',
    ].join('\n');

    const commands = extractInstallCommands(readme);

    expect(commands.claudeDesktop).toContain('mcpServers');
    expect(commands.cursor).toBeUndefined();
  });

  it('associates a shell command with the client named above it', () => {
    const readme = [
      '### Claude Code',
      '',
      '```bash',
      'claude mcp add git -- uvx mcp-server-git',
      '```',
    ].join('\n');

    expect(extractInstallCommands(readme).claudeCode).toBe(
      'claude mcp add git -- uvx mcp-server-git',
    );
  });

  it('returns nothing when no client is named', () => {
    const readme = ['```json', '{ "mcpServers": {} }', '```'].join('\n');
    expect(extractInstallCommands(readme)).toEqual({});
  });
});

describe('parseReadme', () => {
  it('combines every extractor into one result', () => {
    const readme = [
      '# Git MCP Server',
      '',
      'A Model Context Protocol server that gives Claude read and write access to git repositories.',
      '',
      '## Tools',
      '- `git_status`',
      '',
      '## Resources',
      'Exposes repository files as resources.',
      '',
      '```bash',
      'uvx mcp-server-git',
      '```',
    ].join('\n');

    const facts = parseReadme(readme);

    expect(facts.description).toMatch(/^A Model Context Protocol server/);
    expect(facts.pypiPackage).toBe('mcp-server-git');
    expect(facts.toolNames).toEqual(['git_status']);
    expect(facts.hasResources).toBe(true);
    expect(facts.hasPrompts).toBe(false);
    expect(facts.transport).toEqual(['stdio']);
  });
});
