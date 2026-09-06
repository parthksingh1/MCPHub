import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema/index';

/** A fully typed Drizzle handle bound to the MCPHub schema. */
export type Database = PostgresJsDatabase<typeof schema>;

/** Options accepted by {@link createDatabase}. */
export interface CreateDatabaseOptions {
  /** Postgres connection string. Defaults to `process.env.DATABASE_URL`. */
  url?: string;
  /**
   * Max pooled connections. Supabase's free tier allows roughly 60 direct
   * connections in total, so we stay well under it.
   */
  max?: number;
  /** Log every generated SQL statement. Off by default. */
  debug?: boolean;
}

/**
 * Detects Supabase's transaction-mode pooler.
 * Prepared statements are unsupported there and must be disabled.
 */
function isTransactionPooler(url: string): boolean {
  return url.includes('pgbouncer=true') || url.includes(':6543');
}

/**
 * Creates a new Drizzle client. Prefer {@link getDatabase} in the web app —
 * this is for workers and tests that want an isolated, disposable pool.
 */
export function createDatabase(options: CreateDatabaseOptions = {}): {
  db: Database;
  client: postgres.Sql;
} {
  const url = options.url ?? process.env.DATABASE_URL;

  if (!url) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
  }

  const client = postgres(url, {
    max: options.max ?? 10,
    // pgbouncer in transaction mode cannot hold prepared statements.
    prepare: !isTransactionPooler(url),
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return { db: drizzle(client, { schema, logger: options.debug ?? false }), client };
}

/**
 * Module-scoped singleton. Next.js dev mode re-evaluates modules on every hot
 * reload, so the handle is parked on `globalThis` to avoid exhausting the pool.
 */
const globalForDb = globalThis as typeof globalThis & { __mcphubDb?: Database };

/**
 * Returns the shared Drizzle client, creating it on first use.
 * This is the function application code should call.
 */
export function getDatabase(): Database {
  if (!globalForDb.__mcphubDb) {
    globalForDb.__mcphubDb = createDatabase().db;
  }

  return globalForDb.__mcphubDb;
}
