import { CACHE_TTL, CATEGORY_LABELS, type Category } from '@mcphub/shared';
import { ArrowDown, ArrowUp, Minus, Star, Trophy } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { TrustScoreRing } from '@/components/trust-score-ring';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cacheKey, cached } from '@/lib/cache';
import { formatCount, formatRelativeTime } from '@/lib/format';
import { getTrendingServers, listServers, type ServerSummaryRow } from '@/lib/queries/servers';
import { safeQuery } from '@/lib/safe-query';
import { cn } from '@/lib/utils';

/** Rankings regenerate hourly; the underlying scores move once a day. */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Daily MCP server rankings',
  description:
    'The top Model Context Protocol servers ranked by Trust Score, updated daily — plus the fastest risers, most starred, and newest.',
  alternates: { canonical: '/rankings' },
};

/** The leaderboard views, each a deep-linkable `?view=`. */
const VIEWS = {
  top: { label: 'Top rated', blurb: 'Highest Trust Score across the whole index.' },
  rising: { label: 'Rising', blurb: 'Biggest Trust Score gains in the last seven days.' },
  stars: { label: 'Most starred', blurb: 'Ranked by GitHub stars.' },
  new: { label: 'New', blurb: 'The most recently indexed servers.' },
} as const;

type View = keyof typeof VIEWS;

/** Next 15 passes search params as a promise. */
interface PageProps {
  searchParams: Promise<{ view?: string }>;
}

/** Loads the rows for one view. */
async function loadView(view: View): Promise<ServerSummaryRow[]> {
  if (view === 'rising') return getTrendingServers(50, 7);

  const sort = view === 'stars' ? 'stars' : view === 'new' ? 'recent' : 'trust';
  const page = await listServers({ sort, page: 1, pageSize: 50 });
  return page.items;
}

/** The score change since the previous snapshot, rendered with direction. */
function Movement({ now, previous }: { now: number; previous: number | null }): React.JSX.Element {
  if (previous === null || previous === now) {
    return (
      <span className="text-text-muted inline-flex items-center gap-0.5 text-xs" title="No change">
        <Minus className="size-3" aria-hidden />
        <span className="sr-only">No change</span>
      </span>
    );
  }

  const up = now > previous;
  const delta = Math.abs(now - previous);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
        up ? 'text-success' : 'text-danger',
      )}
    >
      {up ? (
        <ArrowUp className="size-3" aria-hidden />
      ) : (
        <ArrowDown className="size-3" aria-hidden />
      )}
      {delta}
      <span className="sr-only">{up ? 'points up' : 'points down'}</span>
    </span>
  );
}

/**
 * Daily rankings.
 *
 * A numbered table rather than another card grid: rank is the point of the
 * page, and a table lets the eye run straight down the positions and scores.
 * Ranking is by Trust Score only — nothing on this page can be bought. Paid
 * Spotlight placements live on their own, clearly labelled page.
 */
export default async function RankingsPage({
  searchParams,
}: PageProps): Promise<React.JSX.Element> {
  const { view: requested } = await searchParams;
  const view: View = requested && requested in VIEWS ? (requested as View) : 'top';

  const rows = await safeQuery('rankings', [] as ServerSummaryRow[], () =>
    cached(cacheKey('rankings', { view }), { ttl: CACHE_TTL.list }, () => loadView(view)),
  );

  const today = new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(new Date());

  return (
    <main className="container py-8">
      <Breadcrumbs items={[{ label: 'Rankings' }]} />

      <header className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Updated daily · {today}</p>
          <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight">
            <Trophy className="text-text-muted size-7" aria-hidden />
            MCP server rankings
          </h1>
          <p className="text-text-secondary mt-2 max-w-prose">{VIEWS[view].blurb}</p>
        </div>
      </header>

      <nav aria-label="Ranking views" className="mt-8 flex gap-1 overflow-x-auto border-b">
        {(Object.keys(VIEWS) as View[]).map((key) => (
          <Link
            key={key}
            href={key === 'top' ? '/rankings' : `/rankings?view=${key}`}
            aria-current={view === key ? 'page' : undefined}
            className={cn(
              '-mb-px inline-flex h-10 items-center whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors',
              view === key
                ? 'border-foreground text-foreground'
                : 'text-text-muted hover:text-foreground border-transparent',
            )}
          >
            {VIEWS[key].label}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed p-12 text-center">
          <p className="font-medium">Nothing to rank yet</p>
          <p className="text-text-muted mt-1 text-sm">
            {view === 'rising'
              ? 'Score movement appears after the second daily refresh.'
              : 'Rankings fill in once servers are indexed.'}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[40rem] text-sm">
            <caption className="sr-only">{VIEWS[view].label} MCP servers</caption>
            <thead>
              <tr className="text-text-muted bg-surface border-b text-left text-xs">
                <th scope="col" className="w-14 px-4 py-3 font-medium">
                  #
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Server
                </th>
                <th scope="col" className="hidden px-4 py-3 font-medium md:table-cell">
                  Category
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Stars
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Change
                </th>
                <th scope="col" className="w-20 px-4 py-3 text-right font-medium">
                  Score
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((server, index) => {
                const category = server.categories[0] as Category | undefined;
                return (
                  <tr key={server.id} className="hover:bg-surface-hover group transition-colors">
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'font-mono text-sm tabular-nums',
                          index < 3 ? 'text-foreground font-semibold' : 'text-text-muted',
                        )}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/servers/${server.slug}`}
                        className="flex min-w-0 items-center gap-3"
                      >
                        <Avatar className="size-8">
                          {server.authorAvatar && <AvatarImage src={server.authorAvatar} alt="" />}
                          <AvatarFallback>{server.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 truncate font-medium group-hover:underline group-hover:underline-offset-2">
                            {server.name}
                            {server.isOfficial && <Badge variant="accent">Official</Badge>}
                          </span>
                          <span className="text-text-muted block truncate text-xs">
                            {view === 'new'
                              ? `updated ${formatRelativeTime(server.updatedAt)}`
                              : server.description}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      {category && <Badge>{CATEGORY_LABELS[category] ?? category}</Badge>}
                    </td>
                    <td className="text-text-secondary px-4 py-3 text-right tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <Star className="size-3" aria-hidden />
                        {formatCount(server.githubStars)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Movement now={server.trustTotal} previous={server.trustPrevious} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <TrustScoreRing score={server.trustTotal} size={34} strokeWidth={3} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-text-muted mt-6 text-xs leading-relaxed">
        Rankings are computed from the open{' '}
        <Link href="/trust-score" className="underline underline-offset-2">
          Trust Score
        </Link>{' '}
        and cannot be bought. Sponsored placements appear only on{' '}
        <Link href="/spotlight" className="underline underline-offset-2">
          Spotlight
        </Link>
        , labelled as such.
      </p>
    </main>
  );
}
