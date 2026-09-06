import type { QualitySignals } from '@mcphub/scoring';
import type {
  Capabilities,
  Category,
  CompatibleClients,
  InstallCommands,
  Language,
  SourceType,
  Transport,
} from '@mcphub/shared';

/**
 * A server as the crawler knows it, before it becomes a database row.
 *
 * Deliberately distinct from the `Server` schema: discovery produces partial,
 * unverified data from several sources, and conflating that with a persisted,
 * scored record is how bad metadata silently reaches the site.
 */
export interface DiscoveredServer {
  slug: string;
  name: string;
  description: string;
  longDescription: string | null;

  authorName: string | null;
  authorGithub: string | null;
  authorAvatar: string | null;
  isOfficial: boolean;

  sourceType: SourceType;
  repoUrl: string;
  packageName: string | null;
  homepageUrl: string | null;

  categories: Category[];
  tags: string[];
  language: Language | null;
  license: string | null;

  compatibleClients: CompatibleClients;
  transport: Transport[];
  installCommands: InstallCommands;
  capabilities: Capabilities;

  githubStars: number;
  githubForks: number;
  githubIssues: number;
  lastCommitAt: string | null;
  firstReleaseAt: string | null;
  lastReleaseAt: string | null;
  npmWeeklyDownloads: number | null;
  pypiMonthlyDownloads: number | null;

  quality: QualitySignals;
}

/** A repository reference produced by a discovery source, before enrichment. */
export interface RepoCandidate {
  /** Canonical `https://github.com/owner/repo` URL. */
  repoUrl: string;
  /** Which source surfaced it, for logging and provenance. */
  discoveredVia: string;
  /** Package name, when the candidate came from a registry rather than GitHub. */
  packageName?: string;
  /** Registry the package name belongs to. */
  registry?: 'npm' | 'pypi';
}

/** Subset of the GitHub repository payload the crawler actually reads. */
export interface GitHubRepo {
  full_name: string;
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  pushed_at: string | null;
  created_at: string | null;
  language: string | null;
  topics: string[];
  archived: boolean;
  fork: boolean;
  size: number;
  license: { spdx_id: string | null; name: string } | null;
  owner: { login: string; avatar_url: string; type: string };
  default_branch: string;
}

/** A GitHub release, used for the maintenance component of the Trust Score. */
export interface GitHubRelease {
  tag_name: string;
  published_at: string | null;
}

/** One entry in a repository's root file listing. */
export interface GitHubTreeEntry {
  path: string;
  type: 'blob' | 'tree' | 'commit';
}
