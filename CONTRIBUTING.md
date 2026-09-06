# Contributing to MCPHub

Thanks for helping build the trusted directory for MCP servers.

## Getting set up

```bash
git clone https://github.com/parthksingh1/MCPHub.git
cd MCPHub
pnpm install
cp .env.example .env    # fill in Supabase + Upstash values
docker compose up -d    # local Postgres 15 + Redis + Upstash REST emulator
pnpm db:migrate
pnpm dev
```

## Before you open a PR

CI runs exactly these, and they must all pass:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Husky runs `lint-staged` on commit, so most issues are fixed for you.

## House rules

- **No `any`.** If you genuinely need an escape hatch, use `unknown` and narrow,
  or leave a `// FIXME:` explaining why it was unavoidable.
- **Every exported function gets a JSDoc comment** saying what it does and why.
- **Trust Score changes need tests.** `packages/scoring` is credibility-critical
  and is held to 100% coverage.
- **Design taste: minimal, spacious, typographic.** No gradient overload, no
  glassmorphism. Motion is subtle and always respects `prefers-reduced-motion`.
- **Watch the free tier.** If a change would push us past Supabase's 500 MB,
  Upstash's 10k commands/day, or Vercel's 100 GB/month, say so in the PR.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/):
`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `perf:`.

## Suggesting a server

You don't need to write code — submit it at `/submit` and the crawler picks it
up within 24 hours.

## License

By contributing you agree your work is licensed under the [MIT License](./LICENSE).
