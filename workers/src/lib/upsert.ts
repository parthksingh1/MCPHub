import { isExcludedRepo, type DiscoveredServer } from '@mcphub/crawler';
import { servers, type Database, type NewServerRow } from '@mcphub/db';
import { computeTrustScore, type ScoringInput } from '@mcphub/scoring';
import { sql } from 'drizzle-orm';

/**
 * Maps a discovered server onto the scoring input.
 *
 * Security is left null here: discovery never scans code, and passing an empty
 * findings list would score an unscanned server identically to an audited one.
 */
export function toScoringInput(server: DiscoveredServer): ScoringInput {
  return {
    lastCommitAt: server.lastCommitAt,
    lastReleaseAt: server.lastReleaseAt,
    openIssues: server.githubIssues,
    stars: server.githubStars,
    isOfficial: server.isOfficial,
    npmWeeklyDownloads: server.npmWeeklyDownloads,
    security: null,
    quality: server.quality,
  };
}

/** Converts an ISO string to a Date, tolerating nulls and bad input. */
function toDate(value: string | null): Date | null {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Builds the database row for a discovered server, Trust Score included. */
export function toServerRow(server: DiscoveredServer): NewServerRow {
  const trust = computeTrustScore(toScoringInput(server));

  return {
    slug: server.slug,
    name: server.name,
    description: server.description,
    longDescription: server.longDescription,

    authorName: server.authorName,
    authorGithub: server.authorGithub,
    authorAvatar: server.authorAvatar,
    isOfficial: server.isOfficial,

    sourceType: server.sourceType,
    repoUrl: server.repoUrl,
    packageName: server.packageName,
    homepageUrl: server.homepageUrl,

    categories: server.categories,
    tags: server.tags,
    language: server.language,
    license: server.license,

    compatibleClients: server.compatibleClients,
    transport: server.transport,
    installCommands: server.installCommands,
    capabilities: server.capabilities,

    githubStars: server.githubStars,
    githubForks: server.githubForks,
    githubIssues: server.githubIssues,
    lastCommitAt: toDate(server.lastCommitAt),
    firstReleaseAt: toDate(server.firstReleaseAt),
    npmWeeklyDownloads: server.npmWeeklyDownloads,
    pypiMonthlyDownloads: server.pypiMonthlyDownloads,

    trustTotal: trust.total,
    trustMaintenance: trust.maintenance,
    trustPopularity: trust.popularity,
    trustSecurity: trust.security,
    trustQuality: trust.quality,
    trustComputedAt: new Date(),

    indexedAt: new Date(),
  };
}

/**
 * Inserts new servers and refreshes existing ones, keyed on `repo_url`.
 *
 * Curated fields are deliberately excluded from the update set. An admin who
 * recategorised a server, marked it verified, or featured it must not have that
 * silently reverted by the next nightly crawl — human judgement outranks the
 * classifier, and a directory that forgets its own moderation is not trusted.
 *
 * `security` is likewise preserved: only the scanner writes it.
 *
 * Repositories on the maintainer exclusion list are dropped before the write,
 * so a removed project never reappears on the next crawl.
 */
export async function upsertServers(
  db: Database,
  candidates: NewServerRow[],
): Promise<{ inserted: number; updated: number }> {
  const rows = candidates.filter((row) => !isExcludedRepo(row.repoUrl));
  if (rows.length === 0) return { inserted: 0, updated: 0 };

  const result = await db
    .insert(servers)
    .values(rows)
    .onConflictDoUpdate({
      target: servers.repoUrl,
      set: {
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        longDescription: sql`excluded.long_description`,
        authorName: sql`excluded.author_name`,
        authorGithub: sql`excluded.author_github`,
        authorAvatar: sql`excluded.author_avatar`,
        isOfficial: sql`excluded.is_official`,
        packageName: sql`excluded.package_name`,
        homepageUrl: sql`excluded.homepage_url`,
        tags: sql`excluded.tags`,
        language: sql`excluded.language`,
        license: sql`excluded.license`,
        compatibleClients: sql`excluded.compatible_clients`,
        transport: sql`excluded.transport`,
        installCommands: sql`excluded.install_commands`,
        capabilities: sql`excluded.capabilities`,
        githubStars: sql`excluded.github_stars`,
        githubForks: sql`excluded.github_forks`,
        githubIssues: sql`excluded.github_issues`,
        lastCommitAt: sql`excluded.last_commit_at`,
        firstReleaseAt: sql`excluded.first_release_at`,
        npmWeeklyDownloads: sql`excluded.npm_weekly_downloads`,
        pypiMonthlyDownloads: sql`excluded.pypi_monthly_downloads`,
        trustMaintenance: sql`excluded.trust_maintenance`,
        trustPopularity: sql`excluded.trust_popularity`,
        trustQuality: sql`excluded.trust_quality`,
        // The security component keeps whatever the scanner last wrote, and the
        // total is recomposed from the stored component rather than the fresh
        // one, so a crawl can never wipe a vulnerability's effect on the score.
        trustTotal: sql`excluded.trust_maintenance + excluded.trust_popularity + ${servers.trustSecurity} + excluded.trust_quality`,
        trustComputedAt: sql`excluded.trust_computed_at`,
        indexedAt: sql`excluded.indexed_at`,
        updatedAt: sql`now()`,
        // Curated by admins; never overwritten by a crawl:
        //   categories, featured, verified, deprecated, security, slug
      },
    })
    // `xmax = 0` is Postgres's own signal that a row in an upsert's RETURNING
    // clause was inserted rather than updated. It is exact, and it costs
    // nothing — the alternative is a second round-trip or a timestamp
    // comparison that quietly misclassifies rows written in the same tick.
    .returning({ id: servers.id, wasInserted: sql<boolean>`(xmax = 0)` });

  const inserted = result.filter((row) => row.wasInserted).length;

  return { inserted, updated: result.length - inserted };
}
