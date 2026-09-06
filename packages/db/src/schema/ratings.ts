import { sql } from 'drizzle-orm';
import {
  check,
  index,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { authUsers } from './auth';
import { servers } from './servers';

/** A user's 1-5 star rating of a server. One per user per server. */
export const ratings = pgTable(
  'ratings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serverId: uuid('server_id')
      .notNull()
      .references(() => servers.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    rating: smallint('rating').notNull(),
    review: text('review'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('ratings_server_user_key').on(table.serverId, table.userId),
    index('ratings_server_id_idx').on(table.serverId),
    check('ratings_rating_range', sql`${table.rating} BETWEEN 1 AND 5`),
  ],
);

export type RatingRow = typeof ratings.$inferSelect;
export type NewRatingRow = typeof ratings.$inferInsert;
