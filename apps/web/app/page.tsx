import { CACHE_TTL, CATEGORY_LABELS } from '@mcphub/shared';
import {
  Activity,
  ArrowRight,
  Award,
  Boxes,
  GitFork,
  LayoutGrid,
  MonitorSmartphone,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';

import { HeroPanel } from '@/components/hero-panel';
import { ServerCard } from '@/components/server-card';
import { SponsoredStrip } from '@/components/sponsored-strip';
import { Button } from '@/components/ui/button';
import { cacheKey, cached } from '@/lib/cache';
import { CATEGORY_ICON } from '@/lib/category-icons';
import { CATEGORY_STYLE } from '@/lib/category-style';
import { formatRelativeTime } from '@/lib/format';
import {
  getCategoryCounts,
  getFeaturedServers,
  getRecentServers,
  getSiteStats,
  getTopServers,
  getTrendingServers,
} from '@/lib/queries/servers';
import { getActiveSponsors } from '@/lib/queries/spotlight';
import { safeQuery } from '@/lib/safe-query';
import { SPOTLIGHT_STRIP_SLOTS } from '@/lib/spotlight';
import { cn } from '@/lib/utils';

/** Regenerate at most once a minute; the homepage is mostly aggregate data. */
export const revalidate = 60;

/** The four Trust Score components, each with its own colour and icon. */
const TRUST_PARTS = [
  {
    name: 'Maintenance',
    detail: 'Commit and release recency. Is anyone still looking after it?',
    icon: Activity,
    tone: 'text-sky-600 bg-sky-500/10 dark:text-sky-300',
    bar: 'bg-sky-500',
  },
  {
    name: 'Popularity',
    detail: 'Stars on a log scale, so small projects still register.',
    icon: Star,
    tone: 'text-amber-600 bg-amber-500/10 dark:text-amber-300',
    bar: 'bg-amber-500',
  },
  {
    name: 'Security',
    detail: 'A purpose-built Semgrep ruleset, plus a dependency audit.',
    icon: ShieldCheck,
    tone: 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-300',
    bar: 'bg-emerald-500',
  },
  {
    name: 'Quality',
    detail: 'README, licence, types, tests, CI — the marks of care.',
    icon: Award,
    tone: 'text-rose-600 bg-rose-500/10 dark:text-rose-300',
    bar: 'bg-rose-500',
  },
] as const;

/** What MCPHub adds on top of a plain list, as a bento grid. */
const FEATURES = [
  {
    title: 'An honest Trust Score',
    text: 'Maintenance, popularity, security and quality — one open, reproducible number for every server.',
    href: '/trust-score',
    icon: Sparkles,
    tone: 'text-emerald-600 bg-emerald-500/10 ring-emerald-500/20 dark:text-emerald-300',
    wide: true,
  },
  {
    title: 'Security scanned',
    text: 'Every repo runs through an MCP-specific Semgrep ruleset and a dependency audit.',
    href: '/security',
    icon: ShieldCheck,
    tone: 'text-rose-600 bg-rose-500/10 ring-rose-500/20 dark:text-rose-300',
    wide: false,
  },
  {
    title: 'Daily rankings',
    text: 'See who leads today, and who climbed fastest this week.',
    href: '/rankings',
    icon: Trophy,
    tone: 'text-amber-600 bg-amber-500/10 ring-amber-500/20 dark:text-amber-300',
    wide: false,
  },
  {
    title: 'Install in one copy',
    text: 'Ready-made config for Claude Desktop, Cursor, VS Code, Windsurf and more — plus side-by-side compare.',
    href: '/compare',
    icon: GitFork,
    tone: 'text-sky-600 bg-sky-500/10 ring-sky-500/20 dark:text-sky-300',
    wide: true,
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

  const [stats, categories, featured, recent, trending, sponsors] = await Promise.all([
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
    safeQuery('spotlight', [], () => cached(cacheKey('spotlight'), { ttl: 60 }, getActiveSponsors)),
  ]);

  const topCategories = [...categories].sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <main className="relative">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="container relative pb-16 pt-14 sm:pt-20">
        {/* Brand glow behind the headline: emerald and cyan, never purple. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[min(900px,100%)] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
          style={{
            background:
              'radial-gradient(closest-side, hsl(var(--accent) / 0.22), transparent), radial-gradient(closest-side at 70% 40%, hsl(var(--accent-to) / 0.2), transparent)',
          }}
        />

        <div className="relative grid items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          <div className="animate-fade-up">
            {/* Live status pill — proof the index is alive, above the fold. */}
            <Link
              href="/rankings?view=new"
              className="bg-surface/80 text-text-secondary hover:border-hover inline-flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-xs shadow-sm backdrop-blur transition-colors"
            >
              <span className="bg-success/15 text-success rounded-full px-2 py-0.5 font-semibold">
                Live
              </span>
              <span className="tabular-nums">
                {stats.totalServers.toLocaleString()} servers indexed
              </span>
              <span className="text-text-muted" aria-hidden>
                ·
              </span>
              <span className="text-text-muted">
                updated {formatRelativeTime(stats.lastIndexedAt)}
              </span>
            </Link>

            <h1 className="text-display tracking-display mt-7 max-w-[13ch] text-balance">
              The trusted directory for <span className="text-gradient">MCP servers</span>.
            </h1>

            <p className="text-text-secondary mt-6 max-w-[46ch] text-lg leading-relaxed">
              Smithery lists them. MCPHub rates, scans, and vets them — so you know exactly what you
              are installing before you run it.
            </p>

            {/* A real form: search works before JavaScript loads. */}
            <form action="/servers" method="get" role="search" className="mt-8 max-w-xl">
              <label htmlFor="hero-search" className="sr-only">
                Search MCP servers
              </label>
              <div className="bg-surface focus-within:border-hover flex items-center gap-2 rounded-2xl border p-1.5 pl-4 shadow-sm transition-colors focus-within:ring-2">
                <Search className="text-text-muted size-5 shrink-0" aria-hidden />
                <input
                  id="hero-search"
                  name="q"
                  type="search"
                  placeholder="Search GitHub, Postgres, Slack, browser…"
                  autoComplete="off"
                  className="placeholder:text-text-muted h-11 min-w-0 flex-1 bg-transparent text-base outline-none"
                />
                <button
                  type="submit"
                  className="bg-brand inline-flex h-11 shrink-0 items-center rounded-xl px-5 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90"
                >
                  Search
                </button>
              </div>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <Link
                href="/servers"
                className="text-foreground group inline-flex items-center gap-1 font-medium"
              >
                Browse all servers
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
              <Link href="/submit" className="text-text-muted hover:text-foreground">
                Submit yours
              </Link>
            </div>

            <dl className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {[
                {
                  label: 'Servers',
                  value: stats.totalServers,
                  icon: Boxes,
                  tone: 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-300',
                },
                {
                  label: 'Categories',
                  value: stats.totalCategories,
                  icon: LayoutGrid,
                  tone: 'text-sky-600 bg-sky-500/10 dark:text-sky-300',
                },
                {
                  label: 'Clients',
                  value: stats.totalClients,
                  icon: MonitorSmartphone,
                  tone: 'text-amber-600 bg-amber-500/10 dark:text-amber-300',
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-surface/70 flex flex-col rounded-xl border p-3 backdrop-blur"
                >
                  <span
                    className={cn('flex size-7 items-center justify-center rounded-lg', stat.tone)}
                  >
                    <stat.icon className="size-4" aria-hidden />
                  </span>
                  <dt className="text-text-muted order-last text-xs">{stat.label}</dt>
                  <dd className="text-foreground mt-2 font-mono text-xl font-semibold tabular-nums tracking-tight">
                    {stat.value.toLocaleString()}
                  </dd>
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

      {/* ── Sponsored (Spotlight) — labelled, separate from every ranking ── */}
      {sponsors.length > 0 && (
        <div className="container pb-12">
          <SponsoredStrip sponsors={sponsors.slice(0, SPOTLIGHT_STRIP_SLOTS)} />
        </div>
      )}

      {/* ── Why MCPHub: bento ────────────────────────────────────────────── */}
      <section className="container py-16">
        <SectionHeading
          eyebrow="Why MCPHub"
          title="More than a list of links"
          detail="Everything you need to decide what to install — and what to avoid."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className={cn(
                'bg-surface hover:border-hover hover:shadow-card-hover group relative overflow-hidden rounded-2xl border p-6 transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-0.5',
                feature.wide && 'md:col-span-2',
              )}
            >
              <span
                className={cn(
                  'flex size-11 items-center justify-center rounded-xl ring-1 ring-inset',
                  feature.tone,
                )}
              >
                <feature.icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{feature.title}</h3>
              <p className="text-text-muted mt-1.5 max-w-prose text-sm leading-relaxed">
                {feature.text}
              </p>
              <span className="text-foreground mt-5 inline-flex items-center gap-1 text-sm font-medium">
                Learn more
                <ArrowRight
                  className="size-3.5 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Highest rated ────────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="container py-16">
          <SectionHeading
            eyebrow="Ranked by Trust Score"
            title="Highest rated"
            detail="Scoring best across maintenance, popularity, security, and quality."
            href="/rankings"
            linkLabel="Full rankings"
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
                className="bg-surface hover:border-hover hover:shadow-card-hover group relative flex items-center gap-3 rounded-2xl border p-4 transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-0.5"
              >
                <span
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
                    CATEGORY_STYLE[category.slug].tile,
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold tracking-tight">
                    {CATEGORY_LABELS[category.slug]}
                  </span>
                  <span className="text-text-muted block text-xs tabular-nums">
                    {category.count.toLocaleString()} servers
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Trust Score explainer ────────────────────────────────────────── */}
      <section className="container py-16">
        <div className="bg-surface halo relative overflow-hidden rounded-3xl border p-8 sm:p-12">
          <div className="relative grid gap-12 lg:grid-cols-[1fr_1.3fr]">
            <div>
              <p className="eyebrow">Open algorithm</p>
              <h2 className="text-section-title mt-2 max-w-[16ch] font-semibold">
                Every server gets one <span className="text-gradient">honest number</span>.
              </h2>
              <p className="text-text-secondary mt-4 max-w-prose text-sm leading-relaxed">
                Four equally weighted components, 25 points each. Deterministic, open source, and
                covered by tests at 100%. You can read it, run it, and disagree with it.
              </p>
              <Button asChild className="mt-7">
                <Link href="/trust-score">
                  Read the full breakdown
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              {TRUST_PARTS.map((part) => (
                <div key={part.name} className="bg-background/60 rounded-2xl border p-5">
                  <dt className="flex items-center gap-3">
                    <span
                      className={cn(
                        'flex size-9 items-center justify-center rounded-lg',
                        part.tone,
                      )}
                    >
                      <part.icon className="size-4" aria-hidden />
                    </span>
                    <span className="font-semibold tracking-tight">{part.name}</span>
                    <span className="text-text-muted ml-auto font-mono text-xs">25 pts</span>
                  </dt>
                  <dd className="text-text-muted mt-3 text-sm leading-relaxed">{part.detail}</dd>
                  <div
                    aria-hidden
                    className="bg-surface-hover mt-4 h-1 overflow-hidden rounded-full"
                  >
                    <div className={cn('h-full w-full rounded-full opacity-80', part.bar)} />
                  </div>
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
            href="/rankings?view=rising"
            linkLabel="All risers"
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
        <section className="container py-16">
          <SectionHeading
            eyebrow="Fresh from the crawler"
            title="Recently added"
            detail="The newest servers to reach the index."
            href="/rankings?view=new"
            linkLabel="View all"
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((server, index) => (
              <ServerCard key={server.id} server={server} index={index} />
            ))}
          </div>
        </section>
      )}

      {/* ── Maintainer call to action ────────────────────────────────────── */}
      <section className="container pb-8 pt-8">
        <div className="bg-surface relative overflow-hidden rounded-3xl border p-8 sm:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(600px 260px at 0% 0%, hsl(var(--accent) / 0.16), transparent 70%), radial-gradient(600px 260px at 100% 100%, hsl(var(--accent-to) / 0.16), transparent 70%)',
            }}
          />
          <div className="relative flex flex-wrap items-center justify-between gap-8">
            <div className="max-w-xl">
              <p className="eyebrow">For maintainers</p>
              <h2 className="text-section-title mt-2 font-semibold">
                Built an MCP server? Get it scored.
              </h2>
              <p className="text-text-secondary mt-3 leading-relaxed">
                Submit your repo, get a Trust Score and a security scan within a day, then show it
                off with a live badge in your README.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/submit"
                className="bg-brand inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90"
              >
                Submit a server
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Button asChild size="lg" variant="secondary">
                <Link href="/badges">
                  <TrendingUp className="size-4" aria-hidden />
                  Get a badge
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
