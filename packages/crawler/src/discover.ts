import { crawlAwesomeLists } from './awesome-lists';
import { repoDedupeKey } from './canonicalize';
import { looksLikeMcpServer } from './classify';
import type { GitHubClient } from './github';
import { searchNpm } from './registries';
import type { RepoCandidate } from './types';

/**
 * GitHub search queries used for discovery.
 *
 * Topic searches are exhaustive but only reach repositories whose authors
 * bothered to tag them; the free-text queries catch the rest, gated on a star
 * floor because unfiltered "mcp server" returns thousands of empty scaffolds.
 */
export const GITHUB_QUERIES = [
  'topic:mcp',
  'topic:mcp-server',
  'topic:mcp-servers',
  'topic:model-context-protocol',
  'topic:modelcontextprotocol',
  '"mcp server" in:name,description stars:>5',
  '"model context protocol" in:name,description stars:>5',
] as const;

/** npm search queries covering both the official scope and the convention. */
export const NPM_QUERIES = [
  '@modelcontextprotocol',
  'mcp-server',
  'mcp server',
  'keywords:mcp',
] as const;

/** Result of a full discovery sweep across every source. */
export interface DiscoveryResult {
  candidates: RepoCandidate[];
  /** Non-fatal problems, recorded to `crawl_logs` for later inspection. */
  errors: string[];
  /** How many candidates each source contributed, before deduplication. */
  bySource: Record<string, number>;
}

/**
 * Runs every discovery source and returns a deduplicated candidate list.
 *
 * Each source is isolated: a failure in one is recorded and the sweep
 * continues. A nightly crawl that indexes 80% of what it could is far better
 * than one that indexes nothing because npm returned a 503.
 */
export async function discoverServers(github: GitHubClient): Promise<DiscoveryResult> {
  const candidates = new Map<string, RepoCandidate>();
  const errors: string[] = [];
  const bySource: Record<string, number> = {};

  /** Adds a candidate unless an earlier source already claimed the repo. */
  const add = (candidate: RepoCandidate): void => {
    const key = repoDedupeKey(candidate.repoUrl);
    if (!key) return;

    bySource[candidate.discoveredVia] = (bySource[candidate.discoveredVia] ?? 0) + 1;

    // First source wins: awesome-lists run last and would otherwise overwrite
    // the richer registry metadata gathered earlier.
    if (!candidates.has(key)) candidates.set(key, candidate);
  };

  // ── GitHub search ─────────────────────────────────────────────────────────
  for (const query of GITHUB_QUERIES) {
    try {
      for (const repo of await github.searchRepositories(query)) {
        if (repo.archived || repo.fork) continue;
        if (!looksLikeMcpServer(repo.name, repo.description, repo.topics ?? [])) continue;

        add({ repoUrl: repo.html_url, discoveredVia: `github:${query}` });
      }
    } catch (error) {
      errors.push(`github:${query}: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  }

  // ── npm registry ──────────────────────────────────────────────────────────
  try {
    for (const candidate of await searchNpm([...NPM_QUERIES])) {
      add(candidate);
    }
  } catch (error) {
    errors.push(`npm: ${error instanceof Error ? error.message : 'unknown'}`);
  }

  // ── Awesome lists ─────────────────────────────────────────────────────────
  const awesome = await crawlAwesomeLists();
  for (const candidate of awesome.candidates) add(candidate);
  errors.push(...awesome.errors);

  return { candidates: [...candidates.values()], errors, bySource };
}
