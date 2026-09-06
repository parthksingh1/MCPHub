import type { CrawlStats } from '@mcphub/shared';
import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/** One execution of a background worker (crawl, scan, health, refresh). */
export const crawlLogs = pgTable(
  'crawl_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    runType: text('run_type').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    status: text('status'),
    stats: jsonb('stats').$type<CrawlStats>(),
    errorLog: text('error_log'),
  },
  (table) => [
    index('crawl_logs_run_type_started_at_idx').on(table.runType, table.startedAt.desc()),
  ],
);

export type CrawlLogRow = typeof crawlLogs.$inferSelect;
export type NewCrawlLogRow = typeof crawlLogs.$inferInsert;
