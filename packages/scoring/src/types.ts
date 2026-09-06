import type { ServerSecurity } from '@mcphub/shared';

/**
 * Signals a repository exposes about its own engineering quality.
 * Populated by the crawler from the repo file tree and package manifest.
 */
export interface QualitySignals {
  /** Length of the README in characters. */
  readmeLength: number;
  /** A LICENSE file is present at the repo root. */
  hasLicense: boolean;
  /** TypeScript types or Python type hints are used. */
  hasTypes: boolean;
  /** A tests directory or an obvious test suite exists. */
  hasTests: boolean;
  /** CI is configured (GitHub Actions, CircleCI, Travis, GitLab CI). */
  hasCi: boolean;
}

/**
 * Everything the Trust Score needs, and nothing it does not.
 *
 * Deliberately narrower than the full `Server` row: scoring must be callable
 * from the crawler with partial data, before a server has ever been persisted.
 */
export interface ScoringInput {
  /** ISO timestamp of the most recent commit, or null if unknown. */
  lastCommitAt: string | null;
  /** ISO timestamp of the most recent release, or null if never released. */
  lastReleaseAt: string | null;
  /** Count of currently open issues. */
  openIssues: number;
  /** GitHub star count. */
  stars: number;
  /** Published by the upstream vendor (e.g. the official GitHub MCP server). */
  isOfficial: boolean;
  /** Weekly npm downloads, if the server is published to npm. */
  npmWeeklyDownloads: number | null;
  /** Security scan results. An unscanned server is treated as unpenalised. */
  security: Pick<ServerSecurity, 'findings' | 'dependencyAudit'> | null;
  /** Repository quality signals. */
  quality: QualitySignals;
}

/**
 * Options for {@link computeTrustScore}, chiefly to make time injectable so
 * tests are not sensitive to the wall clock.
 */
export interface ScoringOptions {
  /** The moment to measure recency against. Defaults to now. */
  now?: Date;
}
