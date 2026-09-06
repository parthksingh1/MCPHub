import { enrichFromNpm, searchNpm } from '@mcphub/crawler';
import { servers } from '@mcphub/db';
import type { NewServerRow } from '@mcphub/db';

import { chunk, runWorker } from './lib/context';
import { toServerRow, upsertServers } from './lib/upsert';

/** npm search queries covering the official scope and the naming convention. */
const QUERIES = ['@modelcontextprotocol', 'mcp-server', 'keywords:mcp', 'mcp server'] as const;

/** How many servers to write per statement. */
const WRITE_BATCH_SIZE = 50;

/**
 * npm-only discovery.
 *
 * A companion to the main crawl rather than a replacement. The GitHub path
 * produces richer records, but it is rate-limited; the npm registry is neither
 * authenticated nor metered, so this worker can index the entire npm side of
 * the ecosystem without touching the GitHub budget at all.
 *
 * Servers found here are upserted on `repo_url`, so when the GitHub crawler
 * later reaches the same repository it enriches the existing row rather than
 * creating a duplicate.
 */
await runWorker('crawl', async ({ db, log }) => {
  const candidates = await searchNpm([...QUERIES]);

  // `searchNpm` only returns packages that declare a repository. Packages
  // without one are still worth indexing, so the raw registry search is
  // re-read here for names alone.
  const packageNames = new Set(
    candidates.map((candidate) => candidate.packageName).filter((name): name is string => !!name),
  );

  log.info(`npm search returned ${packageNames.size} packages`);

  const existing = await db
    .select({ packageName: servers.packageName, slug: servers.slug })
    .from(servers);

  const known = new Set(existing.map((row) => row.packageName).filter(Boolean));

  // Seeded with every slug already persisted, not just those minted this run.
  // `slug` carries its own unique constraint, so a new server colliding with
  // an existing one would otherwise fail the entire write batch.
  const takenSlugs = new Set(existing.map((row) => row.slug));

  // Enrich in batches and write each batch as it completes, rather than
  // accumulating everything and writing once at the end. Fetching a few
  // hundred packuments takes minutes, and a run interrupted partway should
  // leave behind the servers it already processed.
  const pending = [...packageNames].filter((name) => {
    if (!known.has(name)) return true;
    log.count('skipped');
    return false;
  });

  const maxEnrich = Number.parseInt(process.env.MAX_ENRICH ?? '0', 10);
  const toEnrich = maxEnrich > 0 ? pending.slice(0, maxEnrich) : pending;

  log.info(`${pending.length} new packages; enriching ${toEnrich.length}`);

  let processed = 0;

  for (const group of chunk(toEnrich, WRITE_BATCH_SIZE)) {
    const rows: NewServerRow[] = [];

    // Packages within a batch are fetched concurrently: the npm registry is
    // slow per request but handles parallelism fine, and this is the
    // difference between a run taking minutes and taking an hour.
    const results = await Promise.all(
      group.map(async (packageName) => {
        try {
          return await enrichFromNpm(packageName, takenSlugs);
        } catch (error) {
          log.error(`npm ${packageName}: ${error instanceof Error ? error.message : 'unknown'}`);
          return null;
        }
      }),
    );

    for (const server of results) {
      if (!server) {
        log.count('skipped');
        continue;
      }

      rows.push(toServerRow(server));
      log.count('discovered');
    }

    processed += group.length;

    if (rows.length > 0) {
      try {
        const { inserted, updated } = await upsertServers(db, rows);
        log.info(
          `${processed}/${toEnrich.length} processed — wrote ${inserted} new, ${updated} updated`,
        );
        log.count('updated', updated);
      } catch (error) {
        log.error(`write batch: ${error instanceof Error ? error.message : 'unknown'}`);
      }
    }
  }
});
