import { fileURLToPath } from 'node:url';

import { createDatabase, crawlLogs, type Database } from '@mcphub/db';
import type { CrawlStats, RunStatus, RunType } from '@mcphub/shared';
import { config as loadEnv } from 'dotenv';
import { eq, sql } from 'drizzle-orm';
import type postgres from 'postgres';

// Workers run both locally and on GitHub Actions; the repo-root .env is used
// locally and ignored in CI, where secrets arrive as real environment variables.
// `fileURLToPath`, not `URL.pathname`: on Windows the latter yields
// "/C:/Users/..." with a leading slash that no filesystem call accepts.
loadEnv({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });

/** Everything a worker needs: a database handle and a run-scoped logger. */
export interface WorkerContext {
  db: Database;
  client: postgres.Sql;
  log: RunLogger;
}

/**
 * Records a worker run to `crawl_logs`.
 *
 * Every run is logged even when it fails, because a job that silently stopped
 * running is the failure mode that actually hurts: the site goes stale and
 * nothing alerts. A row with `status = 'failed'` is visible; a missing row is
 * not.
 */
export class RunLogger {
  private readonly stats: CrawlStats = { discovered: 0, updated: 0, skipped: 0, errors: 0 };
  private readonly errorLines: string[] = [];
  private id: string | null = null;

  constructor(
    private readonly db: Database,
    private readonly runType: RunType,
  ) {}

  /** Opens the log row. Called once at the start of a run. */
  async start(): Promise<void> {
    const [row] = await this.db
      .insert(crawlLogs)
      .values({ runType: this.runType, startedAt: new Date() })
      .returning({ id: crawlLogs.id });

    this.id = row?.id ?? null;
    console.info(`[${this.runType}] started (log ${this.id ?? 'unlogged'})`);
  }

  /** Increments one of the run counters. */
  count(key: keyof CrawlStats, by = 1): void {
    this.stats[key] += by;
  }

  /** Records a non-fatal error and increments the error counter. */
  error(message: string): void {
    this.stats.errors += 1;
    this.errorLines.push(message);
    console.error(`[${this.runType}] ${message}`);
  }

  /** Writes a progress line. Only visible in the Actions log. */
  info(message: string): void {
    console.info(`[${this.runType}] ${message}`);
  }

  /**
   * Closes the log row.
   *
   * A run that completed with some errors is `partial`, not `failed`: indexing
   * 480 of 500 servers is a success with caveats, and conflating it with a
   * total outage would make the alerting useless.
   */
  async finish(fatal?: unknown): Promise<void> {
    let status: RunStatus = 'success';
    if (fatal) status = 'failed';
    else if (this.stats.errors > 0) status = 'partial';

    if (fatal) {
      this.errorLines.push(fatal instanceof Error ? (fatal.stack ?? fatal.message) : String(fatal));
    }

    console.info(`[${this.runType}] ${status}: ${JSON.stringify(this.stats)}`);

    if (!this.id) return;

    await this.db
      .update(crawlLogs)
      .set({
        finishedAt: new Date(),
        status,
        stats: this.stats,
        // Cap the stored log so one pathological run cannot bloat the row.
        errorLog: this.errorLines.length > 0 ? this.errorLines.join('\n').slice(0, 20_000) : null,
      })
      .where(eq(crawlLogs.id, this.id));
  }

  /** A snapshot of the current counters. */
  get summary(): CrawlStats {
    return { ...this.stats };
  }
}

/**
 * Runs a worker with a database connection and run logging around it.
 *
 * Always closes the pool and always writes the log row, then exits with a
 * non-zero code on failure so the Actions run is visibly red.
 */
export async function runWorker(
  runType: RunType,
  fn: (context: WorkerContext) => Promise<void>,
): Promise<void> {
  if (process.env.LAUNCH_MODE === 'true') {
    console.info(`[${runType}] skipped: LAUNCH_MODE is on`);
    return;
  }

  const { db, client } = createDatabase({ max: 5 });
  const log = new RunLogger(db, runType);

  let fatal: unknown;
  try {
    await log.start();
    await fn({ db, client, log });
  } catch (error) {
    fatal = error;
  } finally {
    await log.finish(fatal);
    await client.end({ timeout: 5 });
  }

  if (fatal) {
    console.error(fatal);
    process.exitCode = 1;
  }
}

/**
 * Splits a list into fixed-size chunks.
 *
 * Used everywhere a worker touches the database in bulk: Supabase's free tier
 * caps connections, and a 500-row statement is also far more likely to time out
 * than ten 50-row ones.
 */
export function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

/** Convenience re-export so workers can build raw SQL without a second import. */
export { sql };
