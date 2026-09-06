import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { authUsers } from './auth';
import { servers } from './servers';

/** A user-filed report flagging a server as spam, malicious, or broken. */
export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serverId: uuid('server_id')
      .notNull()
      .references(() => servers.id, { onDelete: 'cascade' }),
    reportedBy: uuid('reported_by').references(() => authUsers.id, { onDelete: 'set null' }),
    reason: text('reason').notNull(),
    details: text('details'),
    status: text('status').default('open').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('reports_server_id_idx').on(table.serverId),
    index('reports_status_idx').on(table.status),
  ],
);

export type ReportRow = typeof reports.$inferSelect;
export type NewReportRow = typeof reports.$inferInsert;
