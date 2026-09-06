import type {
  Capabilities,
  CompatibleClients,
  InstallCommands,
  LiveStatus,
  ServerSecurity,
} from '@mcphub/shared';
import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { tsvector } from './types';

/**
 * Every indexed MCP server. Stats, security findings, and the Trust Score are
 * denormalised onto this row so the browse and detail pages are single-query.
 */
export const servers = pgTable(
  'servers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    longDescription: text('long_description'),

    // Author info, denormalised from GitHub for query speed.
    authorName: text('author_name'),
    authorGithub: text('author_github'),
    authorAvatar: text('author_avatar'),
    isOfficial: boolean('is_official').default(false).notNull(),

    // Source of truth for the package.
    sourceType: text('source_type').notNull(),
    repoUrl: text('repo_url').notNull(),
    packageName: text('package_name'),
    homepageUrl: text('homepage_url'),

    // Classification. `categories` may be curated by an admin, so the crawler
    // must never blindly overwrite it.
    categories: text('categories')
      .array()
      .default(sql`'{}'::text[]`)
      .notNull(),
    tags: text('tags')
      .array()
      .default(sql`'{}'::text[]`)
      .notNull(),
    language: text('language'),
    license: text('license'),

    // MCP-specific metadata, JSONB so the shape can evolve with the protocol.
    compatibleClients: jsonb('compatible_clients')
      .$type<CompatibleClients>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    transport: text('transport')
      .array()
      .default(sql`'{}'::text[]`)
      .notNull(),
    installCommands: jsonb('install_commands')
      .$type<InstallCommands>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    capabilities: jsonb('capabilities')
      .$type<Capabilities>()
      .default(sql`'{}'::jsonb`)
      .notNull(),

    // Stats, refreshed daily by workers/refresh.ts.
    githubStars: integer('github_stars').default(0).notNull(),
    githubForks: integer('github_forks').default(0).notNull(),
    githubIssues: integer('github_issues').default(0).notNull(),
    lastCommitAt: timestamp('last_commit_at', { withTimezone: true }),
    firstReleaseAt: timestamp('first_release_at', { withTimezone: true }),
    npmWeeklyDownloads: integer('npm_weekly_downloads'),
    pypiMonthlyDownloads: integer('pypi_monthly_downloads'),

    // Security scan results, written weekly by workers/scan.ts.
    security: jsonb('security')
      .$type<ServerSecurity>()
      .default(sql`'{}'::jsonb`)
      .notNull(),

    // Trust Score, computed by @mcphub/scoring.
    trustTotal: integer('trust_total').default(0).notNull(),
    trustMaintenance: integer('trust_maintenance').default(0).notNull(),
    trustPopularity: integer('trust_popularity').default(0).notNull(),
    trustSecurity: integer('trust_security').default(0).notNull(),
    trustQuality: integer('trust_quality').default(0).notNull(),
    trustComputedAt: timestamp('trust_computed_at', { withTimezone: true }),

    // The previous total and when it was superseded. Two columns rather than a
    // history table: the only question the product asks is "how much did this
    // move recently", and answering it from the row itself keeps the trending
    // query a plain indexed scan instead of a self-join over a growing log.
    trustPrevious: integer('trust_previous'),
    trustPreviousAt: timestamp('trust_previous_at', { withTimezone: true }),

    // Liveness for remotely hosted servers, checked hourly.
    liveStatus: jsonb('live_status').$type<LiveStatus>(),

    // Denormalised aggregate of the `ratings` table.
    ratingAvg: numeric('rating_avg', { precision: 3, scale: 2 }).default('0').notNull(),
    ratingCount: integer('rating_count').default(0).notNull(),

    featured: boolean('featured').default(false).notNull(),
    verified: boolean('verified').default(false).notNull(),
    deprecated: boolean('deprecated').default(false).notNull(),

    // Generated full-text search column. Postgres keeps it in sync on write,
    // which is why it is `generatedAlwaysAs` rather than trigger-maintained.
    //
    // Tags go through `public.immutable_array_to_string` (defined in migration
    // 0000) rather than the built-in `array_to_string`: the built-in is only
    // STABLE, and Postgres rejects non-immutable expressions in a generated
    // column. Routing tags through to_tsvector means they are stemmed like the
    // rest of the document, so a search for "postgres" matches the tag
    // "postgres" — `array_to_tsvector` would leave it unstemmed and unmatched.
    searchVector: tsvector('search_vector').generatedAlwaysAs(
      sql`to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || public.immutable_array_to_string(coalesce(tags, '{}'::text[]), ' '))`,
    ),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    indexedAt: timestamp('indexed_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('servers_slug_key').on(table.slug),
    uniqueIndex('servers_repo_url_key').on(table.repoUrl),
    index('servers_trust_total_idx').on(table.trustTotal.desc()),
    index('servers_github_stars_idx').on(table.githubStars.desc()),
    index('servers_updated_at_idx').on(table.updatedAt.desc()),
    // Supports the "biggest movers" query without a sort over the whole table.
    index('servers_trust_delta_idx').on(table.trustPreviousAt.desc(), table.trustTotal.desc()),
    index('servers_categories_idx').using('gin', table.categories),
    index('servers_search_vector_idx').using('gin', table.searchVector),
  ],
);

export type ServerRow = typeof servers.$inferSelect;
export type NewServerRow = typeof servers.$inferInsert;
