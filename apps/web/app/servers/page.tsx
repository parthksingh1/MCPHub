import { CACHE_TTL, serverQuerySchema } from '@mcphub/shared';
import { SearchX } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { BrowseFilters } from '@/components/browse-filters';
import { SearchInput } from '@/components/search-input';
import { ServerCard } from '@/components/server-card';
import { SortSelect } from '@/components/sort-select';
import { Button } from '@/components/ui/button';
import { cacheKey, cached } from '@/lib/cache';
import { getCategoryCounts, listServers } from '@/lib/queries/servers';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Browse MCP servers',
  description:
    'Search and filter every indexed Model Context Protocol server by category, client compatibility, language, and Trust Score.',
};

/** Next 15 passes search params as a promise. */
interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * The browse page.
 *
 * Filters live entirely in the URL, so this stays a server component and every
 * filter combination is independently cacheable at the edge. "Load more" is a
 * real link rather than infinite scroll: it is reachable by keyboard, crawlable
 * by search engines, and does not trap the footer out of reach.
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

  return (
    <main className="container py-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Browse MCP servers</h1>
        <p className="text-text-secondary mt-2 max-w-prose">
          {page.total.toLocaleString()} servers indexed, scored, and ready to install.
        </p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[15rem_1fr]">
        <BrowseFilters categories={categories} total={page.total} />

        <div className="min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput />
            <SortSelect />
          </div>

          <p className="text-text-muted mt-4 text-sm" aria-live="polite">
            {page.total === 0
              ? 'No servers match these filters'
              : `Showing ${page.items.length} of ${page.total.toLocaleString()} servers`}
          </p>

          {page.items.length === 0 ? (
            <div className="mt-8 flex flex-col items-center rounded-lg border border-dashed py-16 text-center">
              <SearchX className="text-text-muted size-8" aria-hidden />
              <h2 className="mt-4 font-medium">Nothing here yet</h2>
              <p className="text-text-muted mt-1 max-w-sm text-sm">
                No server matches every filter you have applied. Try removing one, or lowering the
                minimum Trust Score.
              </p>
              <Button asChild variant="secondary" className="mt-5">
                <Link href="/servers">Clear all filters</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {page.items.map((server, index) => (
                  <ServerCard key={server.id} server={server} index={index} />
                ))}
              </div>

              {page.hasMore && (
                <div className="mt-10 flex justify-center">
                  <Button asChild variant="secondary" size="lg">
                    <Link href={nextPageHref()} scroll={false}>
                      Load more servers
                    </Link>
                  </Button>
                </div>
              )}

              <p className="text-text-muted mt-6 text-center text-xs">
                Page {page.page} of {page.totalPages.toLocaleString()}
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
