/**
 * Repository URL canonicalisation and slug generation.
 *
 * Deduplication is the single most important job of the crawler: the same
 * server is surfaced by GitHub search, npm, PyPI, and three awesome-lists, in
 * six different URL spellings. Everything downstream assumes `repoUrl` is a
 * stable primary key, so normalisation happens here and nowhere else.
 */

/** A repository identified by its owner and name. */
export interface RepoIdentity {
  owner: string;
  repo: string;
}

/**
 * Extracts `{ owner, repo }` from any recognisable GitHub URL or shorthand.
 *
 * Accepts the many forms found in package manifests and READMEs: `https://`
 * and `git://` URLs, `git+https://` prefixes, SSH remotes, `.git` suffixes,
 * trailing slashes, `www.`, deep links to a subpath, and bare `owner/repo`.
 * Returns null for anything that is not a GitHub repository.
 */
export function parseGitHubUrl(input: string): RepoIdentity | null {
  if (!input) return null;

  let value = input.trim();

  // Strip the npm/pip `git+` prefix and any `.git` suffix.
  value = value.replace(/^git\+/, '');
  value = value.replace(/^git:\/\//, 'https://');

  // SSH remotes: git@github.com:owner/repo.git
  const sshMatch = /^(?:ssh:\/\/)?git@github\.com[:/](?<path>.+)$/.exec(value);
  if (sshMatch?.groups?.path) {
    return identityFromPath(sshMatch.groups.path);
  }

  // Bare shorthand: owner/repo (no scheme, no host, exactly one slash).
  if (!value.includes('://') && !value.includes('github.com')) {
    return /^[\w.-]+\/[\w.-]+$/.test(value) ? identityFromPath(value) : null;
  }

  let url: URL;
  try {
    url = new URL(value.includes('://') ? value : `https://${value}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  if (host !== 'github.com') return null;

  return identityFromPath(url.pathname);
}

/** Builds a {@link RepoIdentity} from a `/owner/repo/...` path fragment. */
function identityFromPath(path: string): RepoIdentity | null {
  const segments = path
    .split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  const owner = segments[0];
  const rawRepo = segments[1];
  if (!owner || !rawRepo) return null;

  const repo = rawRepo.replace(/\.git$/i, '');
  if (!repo) return null;

  // GitHub reserves these; a URL like /features/actions is not a repository.
  const reserved = new Set(['features', 'topics', 'collections', 'sponsors', 'orgs', 'settings']);
  if (reserved.has(owner.toLowerCase())) return null;

  return { owner, repo };
}

/**
 * Reduces any GitHub URL spelling to the one canonical form used as the
 * primary key: lowercase host, no trailing slash, no `.git`, no subpath.
 *
 * Owner and repo case is preserved — GitHub paths are case-insensitive for
 * lookup but the canonical casing is what users expect to see displayed.
 */
export function canonicalizeRepoUrl(input: string): string | null {
  const identity = parseGitHubUrl(input);
  if (!identity) return null;

  return `https://github.com/${identity.owner}/${identity.repo}`;
}

/**
 * A case-insensitive key for deduplication.
 *
 * `github.com/Owner/Repo` and `github.com/owner/repo` are the same repository,
 * so the display URL preserves case but the dedupe key does not.
 */
export function repoDedupeKey(input: string): string | null {
  const identity = parseGitHubUrl(input);
  if (!identity) return null;

  return `${identity.owner.toLowerCase()}/${identity.repo.toLowerCase()}`;
}

/**
 * Converts arbitrary text into a URL-safe slug.
 *
 * Strips diacritics, collapses non-alphanumerics to single hyphens, and trims
 * leading and trailing hyphens so the result always satisfies `slugSchema`.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
    .replace(/-+$/g, '');
}

/**
 * Builds the public slug for a server.
 *
 * The repository name alone collides constantly — a dozen people have written
 * `mcp-server-slack` — so the owner is folded in unless the repo name is
 * already distinctive enough to stand on its own.
 */
export function buildSlug(identity: RepoIdentity): string {
  const repoSlug = slugify(identity.repo);
  const ownerSlug = slugify(identity.owner);

  // A generic name needs its owner for context; a specific one does not.
  const generic = /^(mcp|mcp-server|server|mcp-servers|servers|main|app)$/;
  if (generic.test(repoSlug) || repoSlug.length < 4) {
    return slugify(`${ownerSlug}-${repoSlug}`);
  }

  return repoSlug;
}

/**
 * Appends a numeric suffix until the slug is unique within `taken`.
 * Mutating the caller's set is deliberate: it lets a batch of servers be
 * slugged in one pass without a second reconciliation step.
 */
export function ensureUniqueSlug(slug: string, taken: Set<string>): string {
  if (!taken.has(slug)) {
    taken.add(slug);
    return slug;
  }

  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const candidate = `${slug}-${suffix}`;
    if (!taken.has(candidate)) {
      taken.add(candidate);
      return candidate;
    }
  }

  throw new Error(`Unable to find a unique slug for "${slug}"`);
}
