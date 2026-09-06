import {
  FileEtagStore,
  GitHubClient,
  getNpmWeeklyDownloads,
  parseGitHubUrl,
} from '@mcphub/crawler';
import { servers } from '@mcphub/db';
import { computeTrustScore, type ScoringInput } from '@mcphub/scoring';
import { serverSecuritySchema } from '@mcphub/shared';
import { eq, sql } from 'drizzle-orm';

import { chunk, runWorker } from './lib/context';

/** Where conditional-request ETags are cached between scheduled runs. */
const ETAG_CACHE_PATH = '.cache/github-etags.json';

/** How many servers to update per transaction. */
const BATCH_SIZE = 50;

/**
 * Daily stats refresh.
 *
 * Re-reads stars, forks, issues, commit recency, releases, and download counts
 * for every indexed server, then recomputes the Trust Score.
 *
 * Unlike the crawler this touches every row, so it leans hard on conditional
 * requests: a repository that has not changed since yesterday returns 304 and
 * costs nothing against the rate limit.
 */
await runWorker('refresh', async ({ db, log }) => {
  const github = new GitHubClient({
    token: process.env.GITHUB_TOKEN,
    etagStore: new FileEtagStore(ETAG_CACHE_PATH),
  });

  const rows = await db
    .select({
      id: servers.id,
      repoUrl: servers.repoUrl,
      packageName: servers.packageName,
      sourceType: servers.sourceType,
      isOfficial: servers.isOfficial,
      security: servers.security,
      githubStars: servers.githubStars,
      githubForks: servers.githubForks,
      githubIssues: servers.githubIssues,
      lastCommitAt: servers.lastCommitAt,
      trustTotal: servers.trustTotal,
      trustPrevious: servers.trustPrevious,
      trustPreviousAt: servers.trustPreviousAt,
      trustSecurity: servers.trustSecurity,
      // Quality signals live in the file tree, which changes rarely. Rather
      // than re-walking every tree daily, the stored component is carried
      // forward and only the crawler and scanner recompute it.
      trustQuality: servers.trustQuality,
    })
    .from(servers);

  log.info(`refreshing ${rows.length} servers`);

  for (const batch of chunk(rows, BATCH_SIZE)) {
    for (const row of batch) {
      const identity = parseGitHubUrl(row.repoUrl);
      if (!identity) {
        log.count('skipped');
        continue;
      }

      try {
        const result = await github.getRepo(identity.owner, identity.repo);

        if (result.status === 'missing') {
          // The repository is gone. Mark it deprecated rather than deleting:
          // the detail page keeps working, keeps its SEO value, and tells
          // visitors plainly that the source disappeared.
          await db.update(servers).set({ deprecated: true }).where(eq(servers.id, row.id));
          log.info(`${identity.owner}/${identity.repo} is gone; marked deprecated`);
          log.count('updated');
          continue;
        }

        // Unchanged since our last look: nothing to write, nothing to score.
        if (result.status === 'not-modified') {
          log.count('skipped');
          continue;
        }

        const repo = result.data;
        const releases = await github.getReleases(identity.owner, identity.repo, 1);
        const lastReleaseAt = releases[0]?.published_at ?? null;

        const npmWeeklyDownloads =
          row.sourceType === 'npm' && row.packageName
            ? await getNpmWeeklyDownloads(row.packageName)
            : null;

        // The stored security JSON is parsed rather than trusted: it is written
        // by a separate worker and may predate a schema change.
        const security = serverSecuritySchema.safeParse(row.security);

        const scoringInput: ScoringInput = {
          lastCommitAt: repo.pushed_at,
          lastReleaseAt,
          openIssues: repo.open_issues_count,
          stars: repo.stargazers_count,
          isOfficial: row.isOfficial,
          npmWeeklyDownloads,
          security: security.success ? security.data : null,
          // Quality is carried forward, so pass signals that reproduce the
          // stored component exactly rather than recomputing from nothing.
          quality: {
            readmeLength: 0,
            hasLicense: false,
            hasTypes: false,
            hasTests: false,
            hasCi: false,
          },
        };

        const trust = computeTrustScore(scoringInput);
        const newTotal =
          trust.maintenance + trust.popularity + row.trustSecurity + row.trustQuality;

        // Snapshot the old score only when it actually moved. Overwriting it
        // on every run — including the many where nothing changed — would
        // erase the baseline and make every delta read as zero.
        const scoreMoved = newTotal !== row.trustTotal;

        await db
          .update(servers)
          .set({
            githubStars: repo.stargazers_count,
            githubForks: repo.forks_count,
            githubIssues: repo.open_issues_count,
            lastCommitAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
            license: repo.license?.spdx_id ?? null,
            // An archived repository is not maintained; surface that plainly
            // rather than letting it sit in the directory looking healthy.
            deprecated: repo.archived,
            npmWeeklyDownloads,
            trustMaintenance: trust.maintenance,
            trustPopularity: trust.popularity,
            trustSecurity: row.trustSecurity,
            trustQuality: row.trustQuality,
            trustTotal: newTotal,
            trustPrevious: scoreMoved ? row.trustTotal : row.trustPrevious,
            trustPreviousAt: scoreMoved ? new Date() : row.trustPreviousAt,
            trustComputedAt: new Date(),
          })
          .where(eq(servers.id, row.id));

        log.count('updated');
      } catch (error) {
        log.error(`refresh ${row.repoUrl}: ${error instanceof Error ? error.message : 'unknown'}`);
      }
    }

    log.info(`batch done (${log.summary.updated} updated, ${log.summary.skipped} unchanged)`);
  }

  await github.flush();
  log.info(`GitHub requests remaining: ${github.rateLimitRemaining ?? 'unknown'}`);

  // Recompute the denormalised rating aggregate for anything the trigger may
  // have missed (a bulk delete, a restore from backup).
  await db.execute(sql`
    UPDATE servers s
    SET rating_avg = COALESCE(agg.avg_rating, 0),
        rating_count = COALESCE(agg.total, 0)
    FROM (
      SELECT server_id, ROUND(AVG(rating)::numeric, 2) AS avg_rating, COUNT(*) AS total
      FROM ratings GROUP BY server_id
    ) agg
    WHERE s.id = agg.server_id
      AND (s.rating_avg IS DISTINCT FROM agg.avg_rating OR s.rating_count IS DISTINCT FROM agg.total)
  `);
});
