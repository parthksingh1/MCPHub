import { repoDedupeKey } from './canonicalize';

/**
 * Repositories whose maintainers asked to be removed from MCPHub.
 *
 * Kept in the repository rather than the database on purpose: it survives a
 * database reset, every change is reviewed in a pull request, and anyone can
 * audit who was removed and when. Entries are `owner/repo`, any case.
 *
 * To honour a removal request: add the repo here, then delete its row from
 * `servers` (or mark it deprecated if the maintainer prefers).
 */
export const EXCLUDED_REPOS: readonly string[] = [];

const excluded = new Set(EXCLUDED_REPOS.map((repo) => repo.toLowerCase()));

/** True when a repository URL is on the exclusion list and must not be indexed. */
export function isExcludedRepo(repoUrl: string, list: ReadonlySet<string> = excluded): boolean {
  const key = repoDedupeKey(repoUrl);
  return key !== null && list.has(key);
}
