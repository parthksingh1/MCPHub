import { CACHE_TTL, serverQuerySchema } from '@mcphub/shared';
import { SearchX } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { ActiveFilters, CategoryPills, FilterSheet, SortTabs } from '@/components/browse-controls';
import { PageHeader } from '@/components/page-header';
import { SearchInput } from '@/components/search-input';
import { ServerCard } from '@/components/server-card';
import { Button } from '@/components/ui/button';
import { cacheKey, cached } from '@/lib/cache';
import { getCategoryCounts, listServers } from '@/lib/queries/servers';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Browse MCP servers',
  description:
    'Search and filter every indexed Model Context Protocol server by category, client compatibility, language, and Trust Score.',
  alternates: { canonical: '/servers' },
};

/** Next 15 passes search params as a promise. */
interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * The browse page.
 *
 * Laid out top-down rather than with a sidebar: search, then categories as
 * one row, then sort — so the grid gets the full width and nothing competes
 * with the results. Secondary filters sit behind one "Filters" button.
 *
 * Filters live entirely in the URL, so this stays a server component and every
 * combination is independently cacheable. "Load more" is a real link: keyboard
 * reachable, crawlable, and it never traps the footer out of reach.
 */
export default async function BrowsePage({ searchParams }: PageProps): Promise<React.JSX.Element> {
  const raw = await searchParams;

  // Bad input should narrow the results, never break the page — a stray
  // `?minTrust=abc` from a shared link falls back to the defaults.
  const parsed = serverQuerySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : serverQuerySchema.parse({});

  const [page, categories] = await Promise.all([
    cached(cacheKey('servers', { ...query }), { ttl: CACHE_TTL.list }, () => listServers(query)),
    cached(cacheKey('categories'), { ttl: CACHE_TTL.category }, () => getCategoryCounts()),
  ]);

  /** Builds the "load more" href by bumping the page number. */
  const nextPageHref = (): string => {
    const next = new URLSearchParams();

    for (const [key, value] of Object.entries(raw)) {
      if (value === undefined) continue;
      for (const item of Array.isArray(value) ? value : [value]) next.append(key, item);
    }

    next.set('page', String(query.page + 1));
    return `/servers?${next}`;
  };

  const sortedCategories = [...categories].sort((a, b) => b.count - a.count);

  return (
    <main className="container py-8">
      <PageHeader
        crumbs={[{ label: 'Servers' }]}
        title="MCP servers"
        description={`${page.total.toLocaleString()} servers, each scored, scanned and ready to install.`}
      />

      <div className="mt-8 space-y-4">
        <div className="flex gap-3">
          <SearchInput />
          <FilterSheet total={page.total} />
        </div>
        <CategoryPills categories={sortedCategories} />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-6">
        <p className="text-text-secondary text-sm" aria-live="polite">
          {page.total === 0 ? (
            'No servers match'
          ) : (
            <>
              <span className="text-foreground font-semibold tabular-nums">
                {page.total.toLocaleString()}
              </span>{' '}
              {page.total === 1 ? 'server' : 'servers'}
            </>
          )}
        </p>
        <SortTabs />
      </div>

      <div className="mt-4">
        <ActiveFilters />
      </div>

      {page.items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed py-20 text-center">
          <SearchX className="text-text-muted size-8" aria-hidden />
          <h2 className="mt-4 font-semibold">No servers match</h2>
          <p className="text-text-muted mt-1 max-w-sm text-sm">
            Try removing a filter or a word from your search.
          </p>
          <Button asChild variant="secondary" className="mt-5">
            <Link href="/servers">Clear everything</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {page.items.map((server, index) => (
              <ServerCard key={server.id} server={server} index={index} />
            ))}
          </div>

          {page.hasMore && (
            <div className="mt-12 flex flex-col items-center gap-3">
              <Button asChild variant="secondary" size="lg" className="rounded-xl">
                <Link href={nextPageHref()} scroll={false}>
                  Load more servers
                </Link>
              </Button>
              <p className="text-text-muted text-xs">
                Showing {(page.page * page.pageSize).toLocaleString()} of{' '}
                {page.total.toLocaleString()}
              </p>
            </div>
          )}
        </>
      )}
    </main>
  );
}
