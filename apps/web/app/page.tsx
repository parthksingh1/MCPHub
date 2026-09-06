import { CACHE_TTL, CATEGORY_LABELS, type Category } from '@mcphub/shared';
import { ArrowRight, Clock, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import Link from 'next/link';

import { ServerCard } from '@/components/server-card';
import { Button } from '@/components/ui/button';
import { cacheKey, cached } from '@/lib/cache';
import { formatCount, formatRelativeTime } from '@/lib/format';
import {
  getCategoryCounts,
  getFeaturedServers,
  getRecentServers,
  getSiteStats,
  getTopServers,
} from '@/lib/queries/servers';

/** Regenerate at most once a minute; the homepage is mostly aggregate data. */
export const revalidate = 60;

/** Icons for the category grid, keyed by category slug. */
const CATEGORY_EMOJI: Record<Category, string> = {
  database: '🗄️',
  browser: '🌐',
  communication: '💬',
  devtools: '🛠️',
  devops: '🚀',
  ai: '🧠',
  productivity: '📋',
  files: '📁',
  search: '🔍',
  finance: '💳',
  cloud: '☁️',
  security: '🔒',
  monitoring: '📊',
  design: '🎨',
  data: '📈',
  other: '✨',
};

/** The four Trust Score components, for the explainer strip. */
const TRUST_PARTS = [
  {
    name: 'Maintenance',
    detail: 'Recent commits and releases — is anyone still looking after it?',
  },
  {
    name: 'Popularity',
    detail: 'Stars and downloads, on a log scale so small projects still register.',
  },
  { name: 'Security', detail: 'Static analysis for MCP-specific risks, plus a dependency audit.' },
  { name: 'Quality', detail: 'README, licence, types, tests, and CI — the marks of careful work.' },
] as const;

/**
 * The homepage.
 *
 * Every figure shown is read live from the database rather than hard-coded:
 * a directory that advertises a server count it cannot substantiate is exactly
 * the kind of thing MCPHub exists to be the opposite of.
 */
export default async function HomePage(): Promise<React.JSX.Element> {
  const [stats, categories, featured, recent] = await Promise.all([
    cached(cacheKey('stats'), { ttl: CACHE_TTL.stats }, () => getSiteStats()),
    cached(cacheKey('categories'), { ttl: CACHE_TTL.category }, () => getCategoryCounts()),
    // Fall back to the highest-scoring servers until an admin has hand-picked
    // any, so a fresh deployment never shows an empty homepage.
    cached(cacheKey('featured'), { ttl: CACHE_TTL.list }, async () => {
      const picked = await getFeaturedServers(6);
      return picked.length >= 3 ? picked : getTopServers(6);
    }),
    cached(cacheKey('recent'), { ttl: CACHE_TTL.list }, () => getRecentServers(6)),
  ]);

  const topCategories = [...categories].sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="container pb-16 pt-20 sm:pt-28">
        <h1 className="text-display max-w-[15ch] font-semibold">
          The trusted directory for <span className="text-gradient">MCP servers</span>.
        </h1>

        <p className="text-text-secondary mt-6 max-w-prose text-lg leading-relaxed">
          Smithery lists them. MCPHub rates, scans, and vets them. Every server is scored on
          maintenance, popularity, security, and quality — so you know what you are installing
          before you run it.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link href="/servers">
              Browse {formatCount(stats.totalServers)} servers
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/submit">Submit yours</Link>
          </Button>
        </div>

        <dl className="text-text-muted mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Servers indexed</dt>
            <dd className="text-text-secondary font-medium tabular-nums">{stats.totalServers}</dd>
            <span>servers</span>
          </div>
          <span aria-hidden>·</span>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Categories</dt>
            <dd className="text-text-secondary font-medium tabular-nums">
              {stats.totalCategories}
            </dd>
            <span>categories</span>
          </div>
          <span aria-hidden>·</span>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Supported clients</dt>
            <dd className="text-text-secondary font-medium tabular-nums">{stats.totalClients}</dd>
            <span>clients</span>
          </div>
          <span aria-hidden>·</span>
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden />
            <dt className="sr-only">Last updated</dt>
            <dd>updated {formatRelativeTime(stats.lastIndexedAt)}</dd>
          </div>
        </dl>
      </section>

      {/* ── Featured ─────────────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="container py-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                <Sparkles className="text-accent size-4" aria-hidden />
                Highest rated
              </h2>
              <p className="text-text-muted mt-1 text-sm">
                The servers scoring best across all four Trust Score components.
              </p>
            </div>
            <Link
              href="/servers?sort=trust"
              className="text-text-muted hover:text-foreground hidden shrink-0 text-sm transition-colors sm:block"
            >
              View all →
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((server, index) => (
              <ServerCard key={server.id} server={server} index={index} />
            ))}
          </div>
        </section>
      )}

      {/* ── Categories ───────────────────────────────────────────────────── */}
      <section className="container py-12">
        <h2 className="text-xl font-semibold tracking-tight">Browse by category</h2>
        <p className="text-text-muted mt-1 text-sm">Find a server for the tool you already use.</p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {topCategories.map((category) => (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              className="bg-surface hover:border-hover hover:bg-surface-hover group flex items-center gap-3 rounded-lg border p-4 transition-all duration-200 ease-out hover:-translate-y-0.5"
            >
              <span className="text-lg" aria-hidden>
                {CATEGORY_EMOJI[category.slug]}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {CATEGORY_LABELS[category.slug]}
                </span>
                <span className="text-text-muted block text-xs tabular-nums">
                  {category.count} servers
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Recently added ───────────────────────────────────────────────── */}
      {recent.length > 0 && (
        <section className="container py-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                <TrendingUp className="text-accent size-4" aria-hidden />
                Recently added
              </h2>
              <p className="text-text-muted mt-1 text-sm">The newest servers to reach the index.</p>
            </div>
            <Link
              href="/servers?sort=recent"
              className="text-text-muted hover:text-foreground hidden shrink-0 text-sm transition-colors sm:block"
            >
              View all →
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((server, index) => (
              <ServerCard key={server.id} server={server} index={index} />
            ))}
          </div>
        </section>
      )}

      {/* ── Trust Score explainer ────────────────────────────────────────── */}
      <section className="container py-12">
        <div className="bg-surface rounded-lg border p-8">
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <ShieldCheck className="text-accent size-4" aria-hidden />
            How the Trust Score works
          </h2>
          <p className="text-text-secondary mt-2 max-w-prose text-sm leading-relaxed">
            Four equally weighted components, 25 points each. The algorithm is open source and
            deterministic — you can read it, run it, and disagree with it.
          </p>

          <dl className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_PARTS.map((part) => (
              <div key={part.name}>
                <dt className="flex items-baseline gap-2 font-medium">
                  {part.name}
                  <span className="text-text-muted font-mono text-xs">0–25</span>
                </dt>
                <dd className="text-text-muted mt-1.5 text-sm leading-relaxed">{part.detail}</dd>
              </div>
            ))}
          </dl>

          <Button asChild variant="secondary" className="mt-8">
            <Link href="/trust-score">
              Read the full breakdown
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
