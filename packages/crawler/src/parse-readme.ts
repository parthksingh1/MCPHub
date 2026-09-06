import { MCP_CLIENTS, type McpClient, type Transport } from '@mcphub/shared';

/** Everything the crawler can learn from a README alone. */
export interface ReadmeFacts {
  /** First meaningful prose paragraph, trimmed to a card-sized description. */
  description: string | null;
  /** Install commands keyed by client, where one could be identified. */
  installCommands: Partial<Record<McpClient, string>>;
  /** Transports the README claims support for. */
  transport: Transport[];
  /** npm package name, if the README documents one. */
  npmPackage: string | null;
  /** PyPI package name, if the README documents one. */
  pypiPackage: string | null;
  /** Names of MCP tools the server exposes, as documented. */
  toolNames: string[];
  /** The README mentions exposing MCP resources. */
  hasResources: boolean;
  /** The README mentions exposing MCP prompts. */
  hasPrompts: boolean;
}

/** Strips fenced code blocks, HTML, badges, and headings from Markdown. */
function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+.*$/gm, ' ')
    .replace(/^\s*[-*+]\s+/gm, ' ')
    .replace(/[*_>#]/g, ' ');
}

/**
 * Extracts a one-line description from a README.
 *
 * Takes the first prose paragraph after stripping the badge-and-logo preamble
 * that opens most READMEs, then trims to fit the 300-character column without
 * cutting mid-word.
 */
export function extractDescription(markdown: string, maxLength = 280): string | null {
  const prose = stripMarkdown(markdown);

  const paragraphs = prose
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    // Skip fragments too short to be a real sentence, and boilerplate.
    .filter((paragraph) => paragraph.length >= 40)
    .filter(
      (paragraph) => !/^(table of contents|contents|installation|license)\b/i.test(paragraph),
    );

  const first = paragraphs[0];
  if (!first) return null;

  if (first.length <= maxLength) return first;

  const truncated = first.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  return `${(lastSpace > 40 ? truncated.slice(0, lastSpace) : truncated).trimEnd()}…`;
}

/** Every fenced code block in a Markdown document, with its language tag. */
function codeBlocks(markdown: string): { lang: string; body: string }[] {
  const blocks: { lang: string; body: string }[] = [];
  const pattern = /```([\w-]*)\n([\s\S]*?)```/g;

  let match = pattern.exec(markdown);
  while (match !== null) {
    blocks.push({ lang: (match[1] ?? '').toLowerCase(), body: match[2] ?? '' });
    match = pattern.exec(markdown);
  }

  return blocks;
}

/**
 * Finds an npm package name.
 *
 * Prefers an explicit `npx`/`npm install` invocation over a bare mention,
 * because READMEs frequently name unrelated packages in prose.
 */
export function extractNpmPackage(markdown: string): string | null {
  const patterns = [
    /npx\s+(?:-y\s+)?(@[\w.-]+\/[\w.-]+|[\w.-]+)/,
    /npm\s+(?:install|i)\s+(?:-g\s+|--global\s+)?(@[\w.-]+\/[\w.-]+|[\w.-]+)/,
    /pnpm\s+(?:add|install)\s+(?:-g\s+)?(@[\w.-]+\/[\w.-]+|[\w.-]+)/,
  ];

  for (const pattern of patterns) {
    const name = pattern.exec(markdown)?.[1];
    // Ignore flags and obvious non-packages.
    if (name && !name.startsWith('-') && name !== 'y') return name;
  }

  return null;
}

/** Finds a PyPI package name from a documented pip or uvx invocation. */
export function extractPypiPackage(markdown: string): string | null {
  const patterns = [
    /uvx\s+([\w.-]+)/,
    /uv\s+(?:tool\s+)?(?:run|install)\s+([\w.-]+)/,
    /pip(?:3|x)?\s+install\s+(?:-U\s+|--upgrade\s+)?([\w.-]+)/,
  ];

  for (const pattern of patterns) {
    const name = pattern.exec(markdown)?.[1];
    if (name && !name.startsWith('-')) return name;
  }

  return null;
}

/**
 * Detects which transports a server supports.
 *
 * `stdio` is assumed when nothing is stated: it is the default for MCP servers
 * distributed as a command, which is the overwhelming majority.
 */
export function extractTransports(markdown: string): Transport[] {
  const lower = markdown.toLowerCase();
  const found = new Set<Transport>();

  if (/\bstdio\b/.test(lower)) found.add('stdio');
  if (/\bsse\b|server-sent events/.test(lower)) found.add('sse');
  if (/streamable https?|\bhttp transport\b|--transport[= ]http/.test(lower)) found.add('http');

  if (found.size === 0) found.add('stdio');

  return [...found];
}

/**
 * Extracts documented MCP tool names.
 *
 * Matches the convention nearly every server README follows: a "Tools" section
 * listing each tool as a bulleted, backticked identifier.
 */
export function extractToolNames(markdown: string, limit = 40): string[] {
  const section = /##+\s*(?:available\s+)?tools?\b([\s\S]*?)(?=\n##[^#]|\n#\s|$)/i.exec(
    markdown,
  )?.[1];
  if (!section) return [];

  const names = new Set<string>();
  const pattern = /^\s*[-*+]\s*`?\*{0,2}([a-z][\w.-]{2,60})\*{0,2}`?/gim;

  let match = pattern.exec(section);
  while (match !== null && names.size < limit) {
    const name = match[1];
    if (name) names.add(name);
    match = pattern.exec(section);
  }

  return [...names];
}

/**
 * Pulls per-client install commands out of a README.
 *
 * Two strategies, in order of reliability: a JSON config block adjacent to a
 * client's name (the Claude Desktop / Cursor convention), then a shell command
 * under a heading naming that client.
 */
export function extractInstallCommands(markdown: string): Partial<Record<McpClient, string>> {
  const commands: Partial<Record<McpClient, string>> = {};

  /** Human-facing aliases each client is referred to by in the wild. */
  const aliases: Record<McpClient, RegExp> = {
    claudeDesktop: /claude\s*desktop|claude_desktop_config/i,
    claudeCode: /claude\s*code|claude\s+mcp\s+add/i,
    cursor: /\bcursor\b/i,
    cline: /\bcline\b/i,
    windsurf: /\bwindsurf\b|codeium/i,
    vscode: /\bvs\s*code\b|visual\s+studio\s+code/i,
  };

  const blocks = codeBlocks(markdown);

  for (const client of MCP_CLIENTS) {
    const alias = aliases[client];

    // A JSON block whose surrounding text names this client.
    const jsonBlock = blocks.find((block) => {
      if (!['json', 'jsonc', 'json5'].includes(block.lang)) return false;
      if (!block.body.includes('mcpServers')) return false;

      const index = markdown.indexOf(block.body);
      const context = markdown.slice(Math.max(0, index - 400), index);
      return alias.test(context);
    });

    if (jsonBlock) {
      commands[client] = jsonBlock.body.trim();
      continue;
    }

    // A shell command that explicitly targets this client.
    const shellBlock = blocks.find((block) => {
      if (!['bash', 'sh', 'shell', 'zsh', 'console', ''].includes(block.lang)) return false;

      const index = markdown.indexOf(block.body);
      const context = markdown.slice(Math.max(0, index - 300), index);
      return alias.test(context) && /npx|uvx|claude\s+mcp\s+add|pip|docker/.test(block.body);
    });

    if (shellBlock) {
      commands[client] = shellBlock.body.trim().split('\n')[0]?.trim();
    }
  }

  return commands;
}

/** Runs every extractor over a README and returns the combined result. */
export function parseReadme(markdown: string): ReadmeFacts {
  const lower = markdown.toLowerCase();

  return {
    description: extractDescription(markdown),
    installCommands: extractInstallCommands(markdown),
    transport: extractTransports(markdown),
    npmPackage: extractNpmPackage(markdown),
    pypiPackage: extractPypiPackage(markdown),
    toolNames: extractToolNames(markdown),
    hasResources: /##+\s*resources\b|mcp resources|listresources/.test(lower),
    hasPrompts: /##+\s*prompts\b|mcp prompts|listprompts/.test(lower),
  };
}
