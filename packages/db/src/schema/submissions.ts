import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { authUsers } from './auth';
import { servers } from './servers';

/** A community-submitted repository awaiting indexing by the crawler. */
export const submissions = pgTable(
  'submissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    repoUrl: text('repo_url').notNull(),
    submittedBy: uuid('submitted_by').references(() => authUsers.id, { onDelete: 'set null' }),
    notes: text('notes'),
    status: text('status').default('pending').notNull(),
    serverId: uuid('server_id').references(() => servers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
  },
  (table) => [
    index('submissions_status_idx').on(table.status),
    index('submissions_submitted_by_idx').on(table.submittedBy),
  ],
);

export type SubmissionRow = typeof submissions.$inferSelect;
export type NewSubmissionRow = typeof submissions.$inferInsert;
