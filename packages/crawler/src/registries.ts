import { canonicalizeRepoUrl } from './canonicalize';
import { fetchWithRetry } from './http';
import type { RepoCandidate } from './types';

/** Shape of the npm registry search response we read. */
interface NpmSearchResponse {
  objects: {
    package: {
      name: string;
      description?: string;
      links?: { repository?: string; homepage?: string };
    };
  }[];
  total: number;
}

/** Shape of a package document from the npm registry. */
interface NpmPackument {
  name: string;
  description?: string;
  repository?: string | { url?: string };
  homepage?: string;
  license?: string;
  'dist-tags'?: Record<string, string>;
  time?: Record<string, string>;
}

/** Response shape of the npm downloads API. */
interface NpmDownloads {
  downloads: number;
}

/** Response shape of the PyPI JSON API. */
interface PypiPackage {
  info: {
    name: string;
    summary?: string;
    home_page?: string;
    license?: string;
    project_urls?: Record<string, string>;
  };
}

/** Normalises npm's several `repository` spellings to a URL string. */
function npmRepositoryUrl(packument: NpmPackument): string | null {
  const repository = packument.repository;
  if (!repository) return null;

  const raw = typeof repository === 'string' ? repository : repository.url;
  return raw ? canonicalizeRepoUrl(raw) : null;
}

/**
 * Searches the npm registry for MCP server packages.
 *
 * npm's search ranks by its own popularity heuristics rather than relevance, so
 * several narrow queries beat one broad one — `mcp-server-` alone misses the
 * entire `@modelcontextprotocol/*` scope.
 */
export async function searchNpm(queries: string[], limit = 250): Promise<RepoCandidate[]> {
  const candidates = new Map<string, RepoCandidate>();

  for (const query of queries) {
    for (let from = 0; from < limit; from += 250) {
      const params = new URLSearchParams({
        text: query,
        size: String(Math.min(250, limit - from)),
        from: String(from),
      });

      const response = await fetchWithRetry(`https://registry.npmjs.org/-/v1/search?${params}`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) break;

      const body = (await response.json()) as NpmSearchResponse;

      for (const object of body.objects) {
        const repoUrl = object.package.links?.repository
          ? canonicalizeRepoUrl(object.package.links.repository)
          : null;
        if (!repoUrl) continue;

        candidates.set(repoUrl, {
          repoUrl,
          discoveredVia: `npm:${query}`,
          packageName: object.package.name,
          registry: 'npm',
        });
      }

      if (body.objects.length < 250) break;
    }
  }

  return [...candidates.values()];
}

/** Fetches an npm package document, or null when it does not exist. */
export async function getNpmPackage(name: string): Promise<NpmPackument | null> {
  const response = await fetchWithRetry(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) return null;

  return (await response.json()) as NpmPackument;
}

/** Resolves an npm package name to its canonical GitHub URL, if it has one. */
export async function getNpmRepoUrl(name: string): Promise<string | null> {
  const packument = await getNpmPackage(name);
  return packument ? npmRepositoryUrl(packument) : null;
}

/**
 * Fetches weekly download counts for an npm package.
 * Returns null rather than zero when unknown, so the Trust Score can tell
 * "no downloads" apart from "no data".
 */
export async function getNpmWeeklyDownloads(name: string): Promise<number | null> {
  const response = await fetchWithRetry(
    `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(name)}`,
    { headers: { Accept: 'application/json' } },
  );
  if (!response.ok) return null;

  const body = (await response.json()) as NpmDownloads;
  return typeof body.downloads === 'number' ? body.downloads : null;
}

/**
 * Searches PyPI for MCP server packages.
 *
 * PyPI has no JSON search API, so this resolves a known set of naming patterns
 * directly against the JSON endpoint. Less thorough than npm search, but PyPI
 * MCP servers overwhelmingly follow the `mcp-server-*` convention.
 */
export async function searchPypi(packageNames: string[]): Promise<RepoCandidate[]> {
  const candidates: RepoCandidate[] = [];

  for (const name of packageNames) {
    const repoUrl = await getPypiRepoUrl(name);
    if (!repoUrl) continue;

    candidates.push({
      repoUrl,
      discoveredVia: 'pypi',
      packageName: name,
      registry: 'pypi',
    });
  }

  return candidates;
}

/** Fetches a PyPI package document, or null when it does not exist. */
export async function getPypiPackage(name: string): Promise<PypiPackage | null> {
  const response = await fetchWithRetry(`https://pypi.org/pypi/${encodeURIComponent(name)}/json`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) return null;

  return (await response.json()) as PypiPackage;
}

/**
 * Resolves a PyPI package to its GitHub URL.
 * Checks `project_urls` before `home_page`, since the latter is often a docs
 * site rather than the source repository.
 */
export async function getPypiRepoUrl(name: string): Promise<string | null> {
  const pkg = await getPypiPackage(name);
  if (!pkg) return null;

  const urls = Object.values(pkg.info.project_urls ?? {});
  for (const url of urls) {
    const canonical = canonicalizeRepoUrl(url);
    if (canonical) return canonical;
  }

  return pkg.info.home_page ? canonicalizeRepoUrl(pkg.info.home_page) : null;
}
