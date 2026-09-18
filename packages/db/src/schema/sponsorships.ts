import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { servers } from './servers';

/**
 * A paid Spotlight placement.
 *
 * Deliberately a separate table with no link into scoring: nothing that reads
 * `servers.trust_*` or ranks servers ever joins this, so money cannot leak
 * into the Trust Score even by accident.
 *
 * Rows are created `pending` when a payment link is issued and become
 * `active` only when the signed payment webhook confirms payment.
 */
export const sponsorships = pgTable(
  'sponsorships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serverId: uuid('server_id')
      .notNull()
      .references(() => servers.id, { onDelete: 'cascade' }),
    /** The bid in US cents. Bids are ranked on this, whatever was charged. */
    amountCents: integer('amount_cents').notNull(),
    /** What the buyer actually paid: currency and amount in its minor unit. */
    currency: text('currency').notNull(),
    chargedMinor: integer('charged_minor').notNull(),
    /** `pending` → `active`; admins may set `removed` (refunded unused days). */
    status: text('status').default('pending').notNull(),
    /** Payment provider, e.g. `razorpay`. */
    provider: text('provider').notNull(),
    /** The provider's checkout reference (a Razorpay payment link id). */
    providerRef: text('provider_ref').notNull(),
    /** The provider's payment id, set once paid. */
    paymentId: text('payment_id'),
    /** Receipt email from the provider. Never shown publicly. */
    email: text('email'),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('sponsorships_provider_ref_key').on(table.provider, table.providerRef),
    index('sponsorships_active_idx').on(table.status, table.endsAt),
    index('sponsorships_server_id_idx').on(table.serverId),
  ],
);

export type SponsorshipRow = typeof sponsorships.$inferSelect;
export type NewSponsorshipRow = typeof sponsorships.$inferInsert;
