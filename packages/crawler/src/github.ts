import { MemoryEtagStore, type EtagStore } from './etag-store';
import type { GitHubRelease, GitHubRepo, GitHubTreeEntry } from './types';

const API_ROOT = 'https://api.github.com';

/** Options for constructing a {@link GitHubClient}. */
export interface GitHubClientOptions {
  /** Personal access token. Raises the budget from 60 to 5,000 req/hour. */
  token?: string | undefined;
  /** Where conditional-request ETags are kept between runs. */
  etagStore?: EtagStore;
  /** Identifies the crawler to GitHub. Required by their API guidelines. */
  userAgent?: string;
}

/** Outcome of a conditional GET: either fresh data, or an unchanged marker. */
export type ConditionalResult<T> =
  { status: 'ok'; data: T } | { status: 'not-modified' } | { status: 'missing' };

/** A single page of GitHub search results. */
interface SearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepo[];
}

/** Shape of the `git/trees` response we care about. */
interface TreeResponse {
  tree: GitHubTreeEntry[];
  truncated: boolean;
}

/**
 * A small, rate-limit-aware GitHub REST client.
 *
 * Deliberately hand-rolled rather than using Octokit: the crawler needs exactly
 * five endpoints, and pulling in a large dependency to reach them would cost
 * more in cold-start time on GitHub Actions than it saves in code.
 */
export class GitHubClient {
  private readonly token: string | undefined;
  private readonly etags: EtagStore;
  private readonly userAgent: string;

  /** Requests remaining in the current rate-limit window, if known. */
  private remaining: number | null = null;
  /** Unix seconds at which the rate-limit window resets. */
  private resetAt: number | null = null;

  constructor(options: GitHubClientOptions = {}) {
    this.token = options.token || undefined;
    this.etags = options.etagStore ?? new MemoryEtagStore();
    this.userAgent = options.userAgent ?? 'MCPHub-Crawler (+https://github.com/mcphub)';
  }

  /** Requests left in the current window, or null before the first call. */
  get rateLimitRemaining(): number | null {
    return this.remaining;
  }

  /** Persists any ETags collected during this run. */
  async flush(): Promise<void> {
    await this.etags.flush();
  }

  /**
   * Performs a conditional GET, transparently handling rate limits.
   *
   * Returns `not-modified` when GitHub confirms our cached copy is current —
   * the caller should then keep whatever it already had rather than treating
   * this as an error.
   */
  private async request<T>(path: string): Promise<ConditionalResult<T>> {
    await this.waitForRateLimit();

    const url = path.startsWith('http') ? path : `${API_ROOT}${path}`;
    const cachedEtag = await this.etags.get(url);

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': this.userAgent,
    };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    if (cachedEtag) headers['If-None-Match'] = cachedEtag;

    const response = await fetch(url, { headers });
    this.recordRateLimit(response);

    if (response.status === 304) return { status: 'not-modified' };
    if (response.status === 404) return { status: 'missing' };

    if (response.status === 403 || response.status === 429) {
      // Secondary rate limit. Back off and let the caller retry the run.
      throw new GitHubRateLimitError(this.resetAt);
    }

    if (!response.ok) {
      throw new Error(`GitHub ${response.status} for ${url}: ${await response.text()}`);
    }

    const etag = response.headers.get('etag');
    if (etag) await this.etags.set(url, etag);

    return { status: 'ok', data: (await response.json()) as T };
  }

  /** Reads rate-limit headers so the client can pace itself. */
  private recordRateLimit(response: Response): void {
    const remaining = response.headers.get('x-ratelimit-remaining');
    const reset = response.headers.get('x-ratelimit-reset');

    if (remaining !== null) this.remaining = Number.parseInt(remaining, 10);
    if (reset !== null) this.resetAt = Number.parseInt(reset, 10);
  }

  /**
   * Pauses when the budget is nearly spent.
   *
   * A small reserve is kept rather than running to zero, so a concurrent job
   * sharing the same token is not starved by this one.
   */
  private async waitForRateLimit(): Promise<void> {
    if (this.remaining === null || this.remaining > 5) return;
    if (this.resetAt === null) return;

    const waitMs = this.resetAt * 1000 - Date.now() + 1000;
    if (waitMs <= 0) return;

    // Beyond a few minutes it is better to fail the run and let the next
    // scheduled invocation pick up where this one left off.
    if (waitMs > 5 * 60_000) throw new GitHubRateLimitError(this.resetAt);

    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  /**
   * Searches repositories, following pagination up to `maxPages`.
   * Results are capped by GitHub at 1,000 items per query regardless.
   */
  async searchRepositories(query: string, maxPages = 3): Promise<GitHubRepo[]> {
    const results: GitHubRepo[] = [];

    for (let page = 1; page <= maxPages; page += 1) {
      const params = new URLSearchParams({
        q: query,
        sort: 'stars',
        order: 'desc',
        per_page: '100',
        page: String(page),
      });

      const result = await this.request<SearchResponse>(`/search/repositories?${params}`);
      if (result.status !== 'ok') break;

      results.push(...result.data.items);
      if (result.data.items.length < 100) break;
    }

    return results;
  }

  /** Fetches a repository, or null when it is missing or unchanged. */
  async getRepo(owner: string, repo: string): Promise<ConditionalResult<GitHubRepo>> {
    return this.request<GitHubRepo>(`/repos/${owner}/${repo}`);
  }

  /**
   * Fetches the rendered README as Markdown.
   * Returns null when the repository has none.
   */
  async getReadme(owner: string, repo: string): Promise<string | null> {
    await this.waitForRateLimit();

    const url = `${API_ROOT}/repos/${owner}/${repo}/readme`;
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.raw+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': this.userAgent,
    };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    const response = await fetch(url, { headers });
    this.recordRateLimit(response);

    if (response.status === 404) return null;
    if (!response.ok) return null;

    return response.text();
  }

  /** Fetches releases, newest first. Empty when the repo has never released. */
  async getReleases(owner: string, repo: string, limit = 5): Promise<GitHubRelease[]> {
    const result = await this.request<GitHubRelease[]>(
      `/repos/${owner}/${repo}/releases?per_page=${limit}`,
    );

    return result.status === 'ok' ? result.data : [];
  }

  /**
   * Lists the repository's file tree, used for the quality signals.
   *
   * Recursive so nested test directories and CI configs are visible, but the
   * response is capped by GitHub — `truncated` is ignored deliberately, since
   * a partial tree still answers "are there tests?" well enough.
   */
  async getTree(owner: string, repo: string, branch: string): Promise<GitHubTreeEntry[]> {
    const result = await this.request<TreeResponse>(
      `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    );

    return result.status === 'ok' ? result.data.tree : [];
  }
}

/** Raised when GitHub's rate limit is exhausted and waiting is not viable. */
export class GitHubRateLimitError extends Error {
  constructor(public readonly resetAt: number | null) {
    const when = resetAt ? new Date(resetAt * 1000).toISOString() : 'unknown';
    super(`GitHub rate limit exhausted; resets at ${when}`);
    this.name = 'GitHubRateLimitError';
  }
}
