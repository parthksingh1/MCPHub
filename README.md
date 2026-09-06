<div align="center">

# MCPHub

**The trusted directory for MCP servers.**

Smithery lists them. MCPHub rates, scans, and vets them.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://img.shields.io/badge/CI-GitHub%20Actions-black.svg)](./.github/workflows/ci.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-7c3aed.svg)](./CONTRIBUTING.md)

</div>

---

MCPHub indexes, scores, and security-scans Model Context Protocol servers so you
can find one and install it into Claude Desktop, Claude Code, Cursor, Cline, or
Windsurf with a single copied command — and know what you're running first.

> **Status: Phase 1 — Foundation.** The monorepo, design system, and database
> schema are in place. Crawling and scoring land in Phase 2.

## Quick start

```bash
pnpm install
cp .env.example .env    # fill in your Supabase + Upstash values
pnpm dev
```

Open <http://localhost:3000>. Health probe: <http://localhost:3000/api/health>.

For a fully local stack (Postgres 15 + Redis + an Upstash REST emulator):

```bash
docker compose up -d
```

## Repository layout

| Path               | What lives there                                       |
| ------------------ | ------------------------------------------------------ |
| `apps/web`         | Next.js 15 app — pages, Route Handlers, Server Actions |
| `packages/db`      | Drizzle schema, migrations, connection factory         |
| `packages/shared`  | Zod schemas, shared types, constants                   |
| `packages/scoring` | Trust Score algorithm — pure and fully unit-tested     |
| `packages/crawler` | Discovery + parsing logic shared by the workers        |
| `workers/`         | Scripts run on GitHub Actions cron schedules           |
| `supabase/`        | SQL migrations and Edge Functions                      |

## Scripts

| Command            | Description                                     |
| ------------------ | ----------------------------------------------- |
| `pnpm dev`         | Start the Next.js dev server                    |
| `pnpm build`       | Build every workspace package                   |
| `pnpm lint`        | ESLint across the monorepo                      |
| `pnpm typecheck`   | `tsc --noEmit` across the monorepo              |
| `pnpm test`        | Vitest across the monorepo                      |
| `pnpm db:generate` | Generate SQL migrations from the Drizzle schema |
| `pnpm db:migrate`  | Apply migrations to the configured database     |
| `pnpm db:studio`   | Open Drizzle Studio                             |

## How the Trust Score works

Every server gets a 0–100 score built from four equally weighted 0–25 parts:
**maintenance**, **popularity**, **security**, and **quality**. The algorithm is
open source and pure — read it in [`packages/scoring`](./packages/scoring).

## Tech

Next.js 15 · TypeScript · Tailwind · shadcn/ui · Supabase · Drizzle ·
Upstash Redis · Turborepo · Vercel — all on free tiers, $0/month.

## License

[MIT](./LICENSE)
