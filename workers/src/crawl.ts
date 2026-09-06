import {
  FileEtagStore,
  GitHubClient,
  discoverServers,
  enrichCandidate,
  repoDedupeKey,
} from '@mcphub/crawler';
import type { RepoCandidate } from '@mcphub/crawler';
import { servers, submissions } from '@mcphub/db';
import type { NewServerRow } from '@mcphub/db';
import { eq, sql } from 'drizzle-orm';

import { chunk, runWorker } from './lib/context';
import { toServerRow, upsertServers } from './lib/upsert';

/** Where conditional-request ETags are cached between scheduled runs. */
const ETAG_CACHE_PATH = '.cache/github-etags.json';

/** How many servers to write per statement. */
const WRITE_BATCH_SIZE = 50;

/**
 * Daily discovery run.
 *
 * Finds new MCP servers across GitHub, npm, and the community awesome-lists,
 * enriches each one, and upserts it. Existing servers keep their curated
 * fields — see `upsertServers` for exactly which, and why.
 */
await runWorker('crawl', async ({ db, log }) => {
  const github = new GitHubClient({
    token: process.env.GITHUB_TOKEN,
    etagStore: new FileEtagStore(ETAG_CACHE_PATH),
  });

  // ── Discover ──────────────────────────────────────────────────────────────
  const discovery = await discoverServers(github);
  for (const error of discovery.errors) log.error(error);

  log.info(
    `discovered ${discovery.candidates.length} unique candidates from ${
      Object.keys(discovery.bySource).length
    } sources`,
  );

  // ── Fold in pending user submissions ──────────────────────────────────────
  const pending = await db
    .select({ id: submissions.id, repoUrl: submissions.repoUrl })
    .from(submissions)
    .where(eq(submissions.status, 'pending'))
    .limit(200);

  const submissionByKey = new Map<string, string>();
  const candidates: RepoCandidate[] = [...discovery.candidates];

  for (const submission of pending) {
    const key = repoDedupeKey(submission.repoUrl);
    if (!key) continue;

    submissionByKey.set(key, submission.id);
    candidates.push({ repoUrl: submission.repoUrl, discoveredVia: 'submission' });
  }

  if (pending.length > 0) log.info(`including ${pending.length} pending submissions`);

  // ── Skip what we already have and saw recently ────────────────────────────
  const existing = await db
    .select({ repoUrl: servers.repoUrl, indexedAt: servers.indexedAt })
    .from(servers);

  const existingKeys = new Map<string, Date | null>();
  for (const row of existing) {
    const key = repoDedupeKey(row.repoUrl);
    if (key) existingKeys.set(key, row.indexedAt);
  }

  const takenSlugs = new Set<string>();
  const fresh: RepoCandidate[] = [];

  for (const candidate of candidates) {
    const key = repoDedupeKey(candidate.repoUrl);
    if (!key) continue;

    // `refresh` updates stats for known servers every day. Re-enriching them
    // here would burn the GitHub budget on data we already have, so discovery
    // only pays attention to repositories it has never seen.
    if (existingKeys.has(key) && !submissionByKey.has(key)) {
      log.count('skipped');
      continue;
    }

    fresh.push(candidate);
  }

  // Enrichment costs about four GitHub requests per server. `MAX_ENRICH` caps
  // a run so it fits the available budget — essential without a token (60/hour)
  // and a useful safety valve with one. Anything skipped is simply picked up by
  // tomorrow's run, since discovery is idempotent.
  const maxEnrich = Number.parseInt(process.env.MAX_ENRICH ?? '0', 10);
  const toEnrich = maxEnrich > 0 ? fresh.slice(0, maxEnrich) : fresh;

  log.info(
    `${fresh.length} candidates are new; enriching ${toEnrich.length}` +
      (toEnrich.length < fresh.length ? ` (capped by MAX_ENRICH=${maxEnrich})` : ''),
  );

  // ── Enrich ────────────────────────────────────────────────────────────────
  const rows: NewServerRow[] = [];
  const indexedSubmissions: string[] = [];

  for (const candidate of toEnrich) {
    try {
      const server = await enrichCandidate(github, candidate, takenSlugs);
      if (!server) {
        log.count('skipped');
        continue;
      }

      rows.push(toServerRow(server));
      log.count('discovered');

      const key = repoDedupeKey(candidate.repoUrl);
      const submissionId = key ? submissionByKey.get(key) : undefined;
      if (submissionId) indexedSubmissions.push(submissionId);
    } catch (error) {
      log.error(
        `enrich ${candidate.repoUrl}: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }

  await github.flush();
  log.info(`GitHub requests remaining: ${github.rateLimitRemaining ?? 'unknown'}`);

  // ── Write ─────────────────────────────────────────────────────────────────
  for (const batch of chunk(rows, WRITE_BATCH_SIZE)) {
    try {
      const { inserted, updated } = await upsertServers(db, batch);
      log.info(`wrote batch: ${inserted} inserted, ${updated} updated`);
      log.count('updated', updated);
    } catch (error) {
      log.error(`write batch: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  }

  // ── Close out submissions we indexed ──────────────────────────────────────
  if (indexedSubmissions.length > 0) {
    await db
      .update(submissions)
      .set({ status: 'indexed', processedAt: new Date() })
      .where(sql`${submissions.id} = ANY(${indexedSubmissions})`);

    log.info(`marked ${indexedSubmissions.length} submissions as indexed`);
  }
});
