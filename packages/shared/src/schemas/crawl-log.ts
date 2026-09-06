import { z } from 'zod';

import { RUN_STATUSES, RUN_TYPES } from '../constants';

/** Per-run counters written by every background worker. */
export const crawlStatsSchema = z.object({
  discovered: z.number().int().min(0).default(0),
  updated: z.number().int().min(0).default(0),
  skipped: z.number().int().min(0).default(0),
  errors: z.number().int().min(0).default(0),
});
export type CrawlStats = z.infer<typeof crawlStatsSchema>;

/** One execution of a crawl / scan / health / refresh job. */
export const crawlLogSchema = z.object({
  id: z.string().uuid(),
  runType: z.enum(RUN_TYPES),
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().nullable(),
  status: z.enum(RUN_STATUSES).nullable(),
  stats: crawlStatsSchema.nullable(),
  errorLog: z.string().nullable(),
});
export type CrawlLog = z.infer<typeof crawlLogSchema>;
