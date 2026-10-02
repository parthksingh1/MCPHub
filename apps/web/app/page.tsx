import { CACHE_TTL, CATEGORY_LABELS } from '@mcphub/shared';
import { ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';

import { FeatureBento } from '@/components/feature-bento';
import { Leaderboard } from '@/components/leaderboard';
import { McpFlow } from '@/components/mcp-flow';
import { Medal } from '@/components/medal';
import { ProductPreview } from '@/components/product-preview';
import { ServerMarquee } from '@/components/server-marquee';
import { SponsoredStrip } from '@/components/sponsored-strip';
import { Button } from '@/components/ui/button';
import { cacheKey, cached } from '@/lib/cache';
import { CATEGORY_ICON } from '@/lib/category-icons';
import { COLLECTIONS } from '@/lib/collections';
import { formatRelativeTime } from '@/lib/format';
import {
  getCategoryCounts,
  getFeaturedServers,
  getIndexInsights,
  getSiteStats,
  getTopServers,
  getTrustedServers,
} from '@/lib/queries/servers';
import { getActiveSponsors } from '@/lib/queries/spotlight';
import { safeQuery } from '@/lib/safe-query';
import { SPOTLIGHT_STRIP_SLOTS } from '@/lib/spotlight';

/** Regenerate at most once a minute; the homepage is mostly aggregate data. */
export const revalidate = 60;

/** A section heading: eyebrow, a large statement, and an optional link. */
function SectionHeading({
  eyebrow,
  title,
  muted,
  href,
  linkLabel,
}: {
  eyebrow: string;
  title: string;
  /** Trailing words set in the muted tone, Ramp-style two-tone headline. */
  muted?: string;
  href?: string;
  linkLabel?: string;
}): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-2xl">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="text-statement mt-3 text-balance">
          {title}
          {muted && <span className="text-text-muted"> {muted}</span>}
        </h2>
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="text-text-secondary hover:text-foreground group inline-flex shrink-0 items-center gap-1 text-sm font-medium transition-colors"
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

  const [stats, categories, featured, trusted, sponsors, marquee, insights] = await Promise.all([
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
    safeQuery('trusted', [], () =>
      cached(cacheKey('trusted'), { ttl: CACHE_TTL.list }, () => getTrustedServers(6)),
    ),
    safeQuery('spotlight', [], () => cached(cacheKey('spotlight'), { ttl: 60 }, getActiveSponsors)),
    safeQuery('marquee', [], () =>
      cached(cacheKey('marquee'), { ttl: CACHE_TTL.category }, () => getTopServers(30)),
    ),
    safeQuery('insights', null, () =>
      cached(cacheKey('insights'), { ttl: CACHE_TTL.category }, () => getIndexInsights()),
    ),
  ]);

  const topCategories = [...categories].sort((a, b) => b.count - a.count);

  return (
    <main className="relative">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="container relative pb-8 pt-16 sm:pt-24">
        <div className="animate-fade-up mx-auto flex max-w-4xl flex-col items-center text-center">
          {/* Live status pill — proof the index is alive, above the fold. */}
          <Link
            href="/rankings?view=new"
            className="bg-surface/80 text-text-secondary hover:border-hover inline-flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-xs backdrop-blur transition-colors"
          >
            <span className="bg-accent/10 text-accent inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium">
              <span className="bg-accent size-1.5 animate-pulse rounded-full" aria-hidden />
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

          <h1 className="text-display tracking-display mt-8 text-balance">
            The trusted directory <span className="text-text-muted">for MCP servers</span>
          </h1>

          <p className="text-text-secondary mt-6 max-w-[52ch] text-lg leading-relaxed sm:text-xl">
            Every server scored, security-scanned and ranked in the open — so you know exactly what
            you&apos;re installing before you run it.
          </p>

          {/* A real form: search works before JavaScript loads. */}
          <form action="/servers" method="get" role="search" className="mt-10 w-full max-w-xl">
            <label htmlFor="hero-search" className="sr-only">
              Search MCP servers
            </label>
            <div className="bg-surface focus-within:border-hover shadow-tile flex items-center gap-2 rounded-2xl border p-1.5 pl-4 transition-colors focus-within:ring-2">
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
                className="bg-primary text-primary-foreground inline-flex h-11 shrink-0 items-center rounded-xl px-5 text-sm font-semibold transition-[opacity,transform] hover:opacity-90 active:translate-y-px active:scale-[0.98]"
              >
                Search
              </button>
            </div>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
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
            <Link
              href="/submit"
              className="text-text-muted hover:text-foreground transition-colors"
            >
              Submit your server
            </Link>
          </div>
        </div>

        {featured.length > 0 && (
          <div className="animate-fade-up mx-auto mt-16 max-w-5xl [animation-delay:120ms] sm:mt-20">
            <ProductPreview
              servers={featured}
              categories={topCategories}
              total={stats.totalServers}
            />
          </div>
        )}
      </section>

      {/* ── Logo wall: real servers, gliding past ───────────────────────── */}
      <div className="container">
        <ServerMarquee servers={marquee} total={stats.totalServers} />
      </div>

      {/* ── Sponsored (Spotlight) — labelled, separate from every ranking ── */}
      {sponsors.length > 0 && (
        <div className="container pb-4 pt-8">
          <SponsoredStrip sponsors={sponsors.slice(0, SPOTLIGHT_STRIP_SLOTS)} />
        </div>
      )}

      <FeatureBento insights={insights} />

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="container py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">How it works</p>
          <h2 className="text-statement mt-3 text-balance">
            One hub between your AI <span className="text-text-muted">and every tool.</span>
          </h2>
          <p className="text-text-secondary mx-auto mt-5 max-w-[52ch] text-lg leading-relaxed">
            Your AI client speaks MCP. MCPHub tells you which servers are safe to plug into it.
          </p>
        </div>
        <div className="mt-14 hidden md:block">
          <McpFlow servers={trusted.length >= 5 ? trusted : featured} />
        </div>
      </section>

      {/* ── Highest rated ────────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="container py-24">
          <SectionHeading
            eyebrow="Ranked by Trust Score"
            title="Highest rated"
            muted="right now."
            href="/rankings"
            linkLabel="Full rankings"
          />
          <div className="mt-10">
            <Leaderboard servers={featured} />
          </div>
        </section>
      )}

      {/* ── Browse: by job or by tool ────────────────────────────────────── */}
      <section className="container py-24">
        <SectionHeading eyebrow="Browse" title="Start from the job" muted="or the tool." />

        <div className="mt-12 grid grid-cols-1 gap-x-16 gap-y-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="flex items-baseline justify-between">
              <h3 className="font-semibold tracking-tight">Collections</h3>
              <Link
                href="/collections"
                className="text-text-muted hover:text-foreground text-sm transition-colors"
              >
                View all
              </Link>
            </div>
            <ul className="mt-4 border-t">
              {COLLECTIONS.slice(0, 6).map((collection) => (
                <li key={collection.slug} className="border-b">
                  <Link
                    href={`/collections/${collection.slug}`}
                    className="group flex items-center gap-4 py-4"
                  >
                    <collection.icon
                      className="text-text-muted group-hover:text-accent size-5 shrink-0 transition-colors"
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium tracking-tight">{collection.title}</span>
                      <span className="text-text-muted block truncate text-sm">
                        {collection.tagline}
                      </span>
                    </span>
                    <ArrowRight
                      className="text-text-muted group-hover:text-foreground size-4 shrink-0 transition-[transform,color] duration-200 group-hover:translate-x-1"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <h3 className="font-semibold tracking-tight">Categories</h3>
              <Link
                href="/categories"
                className="text-text-muted hover:text-foreground text-sm transition-colors"
              >
                View all
              </Link>
            </div>
            <ul className="mt-4 grid grid-cols-1 border-t sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-1">
              {topCategories.slice(0, 8).map((category) => {
                const Icon = CATEGORY_ICON[category.slug];

                return (
                  <li key={category.slug} className="border-b">
                    <Link
                      href={`/categories/${category.slug}`}
                      className="group flex items-center gap-3 py-3"
                    >
                      <Icon
                        className="text-text-muted group-hover:text-accent size-4 shrink-0 transition-colors"
                        aria-hidden
                      />
                      <span className="flex-1 truncate text-[15px] font-medium tracking-tight">
                        {CATEGORY_LABELS[category.slug]}
                      </span>
                      <span className="text-text-muted text-sm tabular-nums">
                        {category.count.toLocaleString()}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Closing call to action ───────────────────────────────────────── */}
      <section className="container pb-8 pt-16">
        <div className="bg-surface shadow-tile relative overflow-hidden rounded-3xl border px-6 py-16 text-center sm:px-12 sm:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-full"
            style={{
              background:
                'radial-gradient(70% 90% at 50% 120%, hsl(var(--accent) / 0.18), transparent 70%)',
            }}
          />
          <div className="relative mx-auto max-w-2xl">
            <div className="flex justify-center" aria-hidden>
              <Medal award="trusted" size={72} />
            </div>
            <h2 className="text-statement mt-6 text-balance">
              Built an MCP server? <span className="text-text-muted">Get it scored.</span>
            </h2>
            <p className="text-text-secondary mx-auto mt-5 max-w-[48ch] text-lg leading-relaxed">
              Submit your repo and get a Trust Score and security scan within a day — then show it
              off with a live badge in your README.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/submit">
                  Submit a server
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/badges">Get a badge</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
