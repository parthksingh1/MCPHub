import { canonicalizeRepoUrl, repoDedupeKey } from './canonicalize';
import type { RepoCandidate } from './types';

/**
 * Community-maintained indexes of MCP servers, plus Anthropic's own.
 *
 * These are the highest-signal discovery source available: every entry has
 * already been vetted by a human, which GitHub's topic search cannot offer.
 */
export const AWESOME_LISTS = [
  {
    name: 'modelcontextprotocol/servers',
    url: 'https://raw.githubusercontent.com/modelcontextprotocol/servers/main/README.md',
  },
  {
    name: 'punkpeye/awesome-mcp-servers',
    url: 'https://raw.githubusercontent.com/punkpeye/awesome-mcp-servers/main/README.md',
  },
  {
    name: 'wong2/awesome-mcp-servers',
    url: 'https://raw.githubusercontent.com/wong2/awesome-mcp-servers/main/README.md',
  },
  {
    name: 'appcypher/awesome-mcp-servers',
    url: 'https://raw.githubusercontent.com/appcypher/awesome-mcp-servers/main/README.md',
  },
] as const;

/**
 * Pulls every GitHub repository link out of a Markdown document.
 *
 * Deliberately permissive about surrounding syntax — these lists use wildly
 * different table, bullet, and badge conventions — but strict about what counts
 * as a repository, which `canonicalizeRepoUrl` enforces.
 */
export function extractRepoLinks(markdown: string): string[] {
  const found = new Map<string, string>();
  const pattern = /https?:\/\/(?:www\.)?github\.com\/[\w.-]+\/[\w.-]+/g;

  let match = pattern.exec(markdown);
  while (match !== null) {
    const canonical = canonicalizeRepoUrl(match[0]);
    const key = canonical ? repoDedupeKey(canonical) : null;

    if (canonical && key && !found.has(key)) {
      found.set(key, canonical);
    }

    match = pattern.exec(markdown);
  }

  return [...found.values()];
}

/**
 * Fetches and parses every configured awesome-list.
 *
 * A list that fails to fetch is skipped rather than failing the run: these are
 * third-party repositories that get renamed and restructured without warning,
 * and one of them being unavailable should never block a nightly crawl.
 */
export async function crawlAwesomeLists(
  lists: readonly { name: string; url: string }[] = AWESOME_LISTS,
): Promise<{ candidates: RepoCandidate[]; errors: string[] }> {
  const candidates = new Map<string, RepoCandidate>();
  const errors: string[] = [];

  for (const list of lists) {
    try {
      const response = await fetch(list.url, {
        headers: { Accept: 'text/plain', 'User-Agent': 'MCPHub-Crawler' },
      });

      if (!response.ok) {
        errors.push(`${list.name}: HTTP ${response.status}`);
        continue;
      }

      for (const repoUrl of extractRepoLinks(await response.text())) {
        const key = repoDedupeKey(repoUrl);
        if (!key || candidates.has(key)) continue;

        candidates.set(key, { repoUrl, discoveredVia: `awesome:${list.name}` });
      }
    } catch (error) {
      errors.push(`${list.name}: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  return { candidates: [...candidates.values()], errors };
}
