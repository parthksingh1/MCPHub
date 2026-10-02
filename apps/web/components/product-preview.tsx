import { CATEGORY_LABELS, type Category } from '@mcphub/shared';
import { Search, ShieldCheck, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { TrustScoreRing } from '@/components/trust-score-ring';
import { formatCount, formatRelativeTime } from '@/lib/format';

/** The slice of a server the preview renders. */
export interface PreviewServer {
  slug: string;
  name: string;
  authorName: string | null;
  authorAvatar: string | null;
  categories: string[];
  githubStars: number;
  trustTotal: number;
  lastCommitAt: string | Date | null;
}

/** Sidebar rows: a few real categories with live counts. */
export interface PreviewCategory {
  slug: string;
  count: number;
}

/**
 * The hero's product shot.
 *
 * Premium product sites lead with the product itself rather than an
 * illustration. This is a faithful, live miniature of the browse page — real
 * servers, real scores, real counts — framed as an app window. It is plain
 * server-rendered HTML, so it costs nothing to hydrate and every row is a link.
 */
export function ProductPreview({
  servers,
  categories,
  total,
}: {
  servers: PreviewServer[];
  categories: PreviewCategory[];
  total: number;
}): React.JSX.Element {
  return (
    <div className="relative">
      {/* A soft pool of light under the window, in the one accent. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-16 top-24 rounded-[48px] opacity-70 blur-3xl sm:-inset-x-10"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 40%, hsl(var(--accent) / 0.22), transparent 70%)',
        }}
      />

      <div className="bg-surface/90 shadow-window relative overflow-hidden rounded-2xl border backdrop-blur">
        {/* Window chrome */}
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <span className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-[var(--border-hover)]" />
            <span className="size-2.5 rounded-full bg-[var(--border-hover)]" />
            <span className="size-2.5 rounded-full bg-[var(--border-hover)]" />
          </span>
          <div className="bg-background/70 text-text-muted mx-auto flex h-7 w-full max-w-xs items-center justify-center gap-1.5 rounded-md border font-mono text-[11px]">
            <ShieldCheck className="text-accent size-3" aria-hidden />
            mcphub.dev/servers
          </div>
          <span className="w-[42px]" aria-hidden />
        </div>

        <div className="grid md:grid-cols-[13rem_1fr]">
          {/* Sidebar */}
          <aside className="hidden border-r p-4 md:block" aria-hidden>
            <p className="text-text-muted text-xs font-medium">Categories</p>
            <ul className="mt-3 space-y-0.5 text-sm">
              {categories.slice(0, 7).map((category, index) => (
                <li
                  key={category.slug}
                  className={
                    index === 0
                      ? 'bg-surface-hover text-foreground flex items-center justify-between rounded-md px-2.5 py-1.5 font-medium'
                      : 'text-text-secondary flex items-center justify-between px-2.5 py-1.5'
                  }
                >
                  <span className="truncate">{CATEGORY_LABELS[category.slug as Category]}</span>
                  <span className="text-text-muted text-xs tabular-nums">
                    {formatCount(category.count)}
                  </span>
                </li>
              ))}
            </ul>
          </aside>

          {/* Results */}
          <div className="min-w-0">
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <div className="text-text-muted flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md border px-2.5 text-sm">
                <Search className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">Search {total.toLocaleString()} servers…</span>
              </div>
              <span className="text-text-muted hidden shrink-0 text-xs sm:block">
                Sorted by Trust Score
              </span>
            </div>

            <table className="w-full table-fixed text-left text-sm">
              <caption className="sr-only">Highest-scoring MCP servers right now</caption>
              <thead className="text-text-muted text-xs">
                <tr className="border-b">
                  <th scope="col" className="py-2 pl-4 pr-2 font-medium sm:w-[44%] lg:w-[38%]">
                    Server
                  </th>
                  <th scope="col" className="hidden w-[22%] px-2 py-2 font-medium lg:table-cell">
                    Category
                  </th>
                  <th scope="col" className="hidden w-[16%] px-2 py-2 font-medium sm:table-cell">
                    Stars
                  </th>
                  <th scope="col" className="hidden w-[16%] px-2 py-2 font-medium xl:table-cell">
                    Updated
                  </th>
                  <th scope="col" className="w-20 py-2 pl-2 pr-4 text-right font-medium">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {servers.slice(0, 6).map((server) => (
                  <tr key={server.slug} className="hover:bg-surface-hover/60 transition-colors">
                    <td className="py-2.5 pl-4 pr-2">
                      <Link
                        href={`/servers/${server.slug}`}
                        className="flex min-w-0 items-center gap-2.5"
                      >
                        {server.authorAvatar ? (
                          <Image
                            src={server.authorAvatar}
                            alt=""
                            width={28}
                            height={28}
                            priority
                            className="size-7 shrink-0 rounded-md border object-cover"
                          />
                        ) : (
                          <span className="bg-surface-hover text-text-muted flex size-7 shrink-0 items-center justify-center rounded-md border font-mono text-xs uppercase">
                            {server.name.slice(0, 1)}
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{server.name}</span>
                          <span className="text-text-muted block truncate font-mono text-[11px]">
                            {server.authorName ?? 'unknown'}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="text-text-secondary hidden whitespace-nowrap px-2 py-2.5 lg:table-cell">
                      {server.categories[0]
                        ? CATEGORY_LABELS[server.categories[0] as Category]
                        : '—'}
                    </td>
                    <td className="text-text-secondary hidden whitespace-nowrap px-2 py-2.5 tabular-nums sm:table-cell">
                      <span className="inline-flex items-center gap-1">
                        <Star className="size-3" aria-hidden />
                        {formatCount(server.githubStars)}
                      </span>
                    </td>
                    <td className="text-text-muted hidden whitespace-nowrap px-2 py-2.5 xl:table-cell">
                      {formatRelativeTime(server.lastCommitAt)}
                    </td>
                    <td className="py-2 pl-2 pr-4">
                      <TrustScoreRing
                        score={server.trustTotal}
                        size={34}
                        strokeWidth={3}
                        className="ml-auto"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
