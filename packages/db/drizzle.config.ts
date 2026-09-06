import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Env lives at the repo root so workers, drizzle-kit, and the web app share it.
loadEnv({ path: '../../.env' });

/**
 * drizzle-kit uses the *direct* Postgres connection (port 5432), not the
 * transaction-mode pooler — DDL and advisory locks do not work over pgbouncer.
 */
// Left empty when unset so `drizzle-kit generate` still works offline;
// `migrate` / `push` / `studio` fail loudly at connect time instead.
const url = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL ?? '';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: '../../supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: { url },
  verbose: true,
  strict: true,
});
