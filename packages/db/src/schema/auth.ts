import { pgSchema, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Supabase's managed `auth` schema. Declared here only so our tables can
 * express foreign keys against `auth.users`. Drizzle never migrates it —
 * GoTrue owns this table.
 */
export const authSchema = pgSchema('auth');

/** Minimal projection of `auth.users`; enough for referential integrity. */
export const authUsers = authSchema.table('users', {
  id: uuid('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }),
});
