import { CATEGORY_LABELS, type Category } from '@mcphub/shared';
import { ArrowUpRight, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import type { PreviewServer } from '@/components/product-preview';
import { TrustScoreRing } from '@/components/trust-score-ring';
import { formatCount } from '@/lib/format';

/** A leaderboard row also carries the one-line description. */
export interface LeaderboardServer extends PreviewServer {
  description: string | null;
  language: string | null;
}

/**
 * A ranked, ruled list of the top servers.
 *
 * Rankings read best as a list, not a grid of cards: the eye runs straight
 * down the rank and the score, and every row lines up with the next.
 */
export function Leaderboard({ servers }: { servers: LeaderboardServer[] }): React.JSX.Element {
  return (
    <ol className="border-t">
      {servers.map((server, index) => (
        <li key={server.slug} className="border-b">
          <Link
            href={`/servers/${server.slug}`}
            className="hover:bg-surface/70 group -mx-3 grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-4 rounded-xl px-3 py-4 transition-colors sm:grid-cols-[2.5rem_minmax(0,1fr)_9rem_6rem_auto] sm:gap-x-6"
          >
            <span className="text-text-muted font-mono text-sm tabular-nums">
              {String(index + 1).padStart(2, '0')}
            </span>

            <span className="flex min-w-0 items-center gap-3.5">
              {server.authorAvatar ? (
                <Image
                  src={server.authorAvatar}
                  alt=""
                  width={40}
                  height={40}
                  className="size-10 shrink-0 rounded-lg border object-cover"
                />
              ) : (
                <span className="bg-surface-hover text-text-muted flex size-10 shrink-0 items-center justify-center rounded-lg border font-mono text-sm uppercase">
                  {server.name.slice(0, 1)}
                </span>
              )}
              <span className="min-w-0">
                <span className="flex items-center gap-1.5">
                  <span className="truncate font-semibold tracking-tight">{server.name}</span>
                  <ArrowUpRight
                    className="text-text-muted size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden
                  />
                </span>
                <span className="text-text-muted block truncate text-sm">
                  {server.description ?? server.authorName ?? ''}
                </span>
              </span>
            </span>

            <span className="text-text-secondary hidden truncate text-sm sm:block">
              {server.categories[0] ? CATEGORY_LABELS[server.categories[0] as Category] : '—'}
            </span>

            <span className="text-text-secondary hidden items-center gap-1 text-sm tabular-nums sm:inline-flex">
              <Star className="size-3.5" aria-hidden />
              {formatCount(server.githubStars)}
            </span>

            <TrustScoreRing score={server.trustTotal} size={42} strokeWidth={3.5} />
          </Link>
        </li>
      ))}
    </ol>
  );
}
