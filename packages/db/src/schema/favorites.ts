import { pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';

import { authUsers } from './auth';
import { servers } from './servers';

/** Servers a user has saved to their dashboard. */
export const favorites = pgTable(
  'favorites',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    serverId: uuid('server_id')
      .notNull()
      .references(() => servers.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.serverId] })],
);

export type FavoriteRow = typeof favorites.$inferSelect;
export type NewFavoriteRow = typeof favorites.$inferInsert;
