import { CACHE_TTL, CATEGORY_LABELS, type Category } from '@mcphub/shared';
import {
  ArrowRight,
  Boxes,
  Braces,
  Cloud,
  CreditCard,
  Database,
  FileText,
  Globe,
  LineChart,
  MessageSquare,
  Palette,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';

import { HeroPanel } from '@/components/hero-panel';
import { ServerCard } from '@/components/server-card';
import { Button } from '@/components/ui/button';
import { cacheKey, cached } from '@/lib/cache';
import { formatRelativeTime } from '@/lib/format';
import {
  getCategoryCounts,
  getFeaturedServers,
  getRecentServers,
  getSiteStats,
  getTopServers,
  getTrendingServers,
} from '@/lib/queries/servers';
import { safeQuery } from '@/lib/safe-query';

/** Regenerate at most once a minute; the homepage is mostly aggregate data. */
export const revalidate = 60;

/** Icons for the category grid, keyed by category slug. */
const CATEGORY_ICON: Record<Category, typeof Database> = {
  database: Database,
  browser: Globe,
  communication: MessageSquare,
  devtools: Wrench,
  devops: Rocket,
  ai: Sparkles,
  productivity: FileText,
  files: Boxes,
  search: Search,
  finance: CreditCard,
  cloud: Cloud,
  security: ShieldCheck,
  monitoring: LineChart,
  design: Palette,
  data: Braces,
  other: Terminal,
};

/** The four Trust Score components, for the explainer strip. */
const TRUST_PARTS = [
  {
    name: 'Maintenance',
    detail: 'Commit and release recency. Is anyone still looking after it?',
  },
  {
    name: 'Popularity',
    detail: 'Stars on a log scale, so small projects still register.',
  },
  {
    name: 'Security',
    detail: 'A purpose-built Semgrep ruleset, plus a dependency audit.',
  },
  {
    name: 'Quality',
    detail: 'README, licence, types, tests, CI — the marks of care.',
  },
] as const;

/** A monospace eyebrow above a section heading. */
function SectionHeading({
  eyebrow,
  title,
  detail,
  href,
  linkLabel,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  href?: string;
  linkLabel?: string;
}): React.JSX.Element {
  return (
    <div className="flex items-end justify-between gap-6">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="text-section-title mt-2 font-semibold">{title}</h2>
        <p className="text-text-muted mt-1.5 text-sm">{detail}</p>
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="text-text-muted hover:text-foreground group hidden shrink-0 items-center gap-1 text-sm transition-colors sm:inline-flex"
        >
          {linkLabel}
          <ArrowRight
            className="size-3.5 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      )}
    </div>
  );
}

/**
 * The homepage.
 *
 * Every figure shown is read live from the database rather than hard-coded:
 * a directory that advertises a server count it cannot substantiate is exactly
 * the kind of thing MCPHub exists to be the opposite of.
 */
export default async function HomePage(): Promise<React.JSX.Element> {
  const emptyStats = {
    totalServers: 0,
    verifiedServers: 0,
    totalCategories: 0,
    totalClients: 0,
    lastIndexedAt: null,
  };

  const [stats, categories, featured, recent, trending] = await Promise.all([
    safeQuery('stats', emptyStats, () =>
      cached(cacheKey('stats'), { ttl: CACHE_TTL.stats }, () => getSiteStats()),
    ),
    safeQuery('categories', [], () =>
      cached(cacheKey('categories'), { ttl: CACHE_TTL.category }, () => getCategoryCounts()),
    ),
    // Fall back to the highest-scoring servers until an admin has hand-picked
    // any, so a fresh deployment never shows an empty homepage.
    safeQuery('featured', [], () =>
      cached(cacheKey('featured'), { ttl: CACHE_TTL.list }, async () => {
        const picked = await getFeaturedServers(6);
        return picked.length >= 3 ? picked : getTopServers(6);
      }),
    ),
    safeQuery('recent', [], () =>
      cached(cacheKey('recent'), { ttl: CACHE_TTL.list }, () => getRecentServers(6)),
    ),
    safeQuery('trending', [], () =>
      cached(cacheKey('trending'), { ttl: CACHE_TTL.list }, () => getTrendingServers(6)),
    ),
  ]);

  const topCategories = [...categories].sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <main className="relative">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="container relative pb-14 pt-14 sm:pt-20">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          <div className="animate-fade-up">
            {/* Live status pill — proof the index is alive, above the fold. */}
            <Link
              href="/servers?sort=recent"
              className="panel text-text-secondary hover:border-hover group inline-flex items-center gap-2 rounded-full py-1 pl-1.5 pr-3 text-xs transition-colors"
            >
              <span className="relative flex size-4 items-center justify-center">
                <span className="bg-success/40 animate-pulse-ring absolute size-2 rounded-full" />
                <span className="bg-success relative size-1.5 rounded-full" />
              </span>
              <span className="tabular-nums">{stats.totalServers} servers indexed</span>
              <span className="text-text-muted" aria-hidden>
                ·
              </span>
              <span className="text-text-muted">
                updated {formatRelativeTime(stats.lastIndexedAt)}
              </span>
            </Link>

            <h1 className="text-display tracking-display mt-7 max-w-[13ch] text-balance">
              The trusted directory for{' '}
              <span className="text-gradient animate-gradient-drift bg-[length:200%_auto]">
                MCP servers
              </span>
              .
            </h1>

            <p className="text-text-secondary mt-6 max-w-[46ch] text-lg leading-relaxed">
              Smithery lists them. MCPHub rates, scans, and vets them — so you know exactly what you
              are installing before you run it.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/servers">
                  Browse {stats.totalServers} servers
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/submit">Submit yours</Link>
              </Button>
            </div>

            <dl className="text-text-muted mt-9 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
              {[
                { label: 'servers', value: stats.totalServers },
                { label: 'categories', value: stats.totalCategories },
                { label: 'clients', value: stats.totalClients },
              ].map((stat) => (
                <div key={stat.label} className="flex items-baseline gap-1.5">
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="text-foreground font-mono text-xl font-medium tabular-nums tracking-tight">
                    {stat.value}
                  </dd>
                  <span>{stat.label}</span>
                </div>
              ))}
            </dl>
          </div>

          {featured.length > 0 && (
            <HeroPanel
              servers={featured.map((server) => ({
                slug: server.slug,
                name: server.name,
                authorName: server.authorName,
                trustTotal: server.trustTotal,
              }))}
            />
          )}
        </div>
      </section>

      <div className="container">
        <div className="rule-fade" />
      </div>

      {/* ── Highest rated ────────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="container py-16">
          <SectionHeading
            eyebrow="Ranked by Trust Score"
            title="Highest rated"
            detail="Scoring best across maintenance, popularity, security, and quality."
            href="/servers?sort=trust"
            linkLabel="View all"
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((server, index) => (
              <ServerCard key={server.id} server={server} index={index} />
            ))}
          </div>
        </section>
      )}

      {/* ── Categories ───────────────────────────────────────────────────── */}
      <section className="container py-16">
        <SectionHeading
          eyebrow="By integration"
          title="Browse by category"
          detail="Find a server for the tool you already use."
          href="/categories"
          linkLabel="All categories"
        />

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {topCategories.map((category) => {
            const Icon = CATEGORY_ICON[category.slug];

            return (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}`}
                className="gradient-border bg-surface hover:bg-surface-hover group relative flex items-center gap-3 rounded-xl border p-4 transition-all duration-300 ease-out hover:-translate-y-0.5"
              >
                <span className="border-border bg-background text-text-muted group-hover:text-accent flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium tracking-tight">
                    {CATEGORY_LABELS[category.slug]}
                  </span>
                  <span className="text-text-muted block font-mono text-[11px] tabular-nums">
                    {category.count}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Trust Score explainer ────────────────────────────────────────── */}
      <section className="container py-16">
        <div className="panel relative overflow-hidden rounded-2xl p-8 sm:p-12">
          <div
            aria-hidden
            className="from-accent/[0.08] pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-gradient-to-br to-transparent blur-3xl"
          />

          <div className="relative grid gap-12 lg:grid-cols-[1fr_1.3fr]">
            <div>
              <p className="eyebrow">Open algorithm</p>
              <h2 className="text-section-title mt-2 max-w-[16ch] font-semibold">
                Every server gets one honest number.
              </h2>
              <p className="text-text-secondary mt-4 max-w-prose text-sm leading-relaxed">
                Four equally weighted components, 25 points each. Deterministic, open source, and
                covered by tests at 100%. You can read it, run it, and disagree with it.
              </p>
              <Button asChild variant="secondary" className="mt-7">
                <Link href="/trust-score">
                  Read the full breakdown
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>

            <dl className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
              {TRUST_PARTS.map((part, index) => (
                <div key={part.name}>
                  <dt className="flex items-baseline gap-2.5">
                    <span className="text-text-muted font-mono text-[11px] tabular-nums">
                      0{index + 1}
                    </span>
                    <span className="font-medium tracking-tight">{part.name}</span>
                    <span className="text-text-muted ml-auto font-mono text-[11px]">/25</span>
                  </dt>
                  <dd className="text-text-muted mt-2 text-sm leading-relaxed">{part.detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ── Trending ─────────────────────────────────────────────────────── */}
      {trending.length > 0 && (
        <section className="container py-16">
          <SectionHeading
            eyebrow="Biggest movers"
            title="Trending this week"
            detail="Servers whose Trust Score rose the most in the last seven days."
            href="/servers?sort=trust"
            linkLabel="View all"
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trending.map((server, index) => (
              <ServerCard key={server.id} server={server} index={index} />
            ))}
          </div>
        </section>
      )}

      {/* ── Recently added ───────────────────────────────────────────────── */}
      {recent.length > 0 && (
        <section className="container pb-8 pt-4">
          <SectionHeading
            eyebrow="Fresh from the crawler"
            title="Recently added"
            detail="The newest servers to reach the index."
            href="/servers?sort=recent"
            linkLabel="View all"
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((server, index) => (
              <ServerCard key={server.id} server={server} index={index} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
