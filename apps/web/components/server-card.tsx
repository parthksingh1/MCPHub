import { CATEGORY_LABELS, type Category } from '@mcphub/shared';
import { BadgeCheck, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { TrustScoreRing } from '@/components/trust-score-ring';
import { Badge } from '@/components/ui/badge';
import { categoryStyle } from '@/lib/category-style';
import { formatCount, formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';

/** The subset of a server a card needs. */
export interface ServerCardData {
  slug: string;
  name: string;
  description: string;
  authorName: string | null;
  authorAvatar: string | null;
  isOfficial: boolean;
  categories: string[];
  language: string | null;
  githubStars: number;
  lastCommitAt: Date | string | null;
  trustTotal: number;
  verified: boolean;
  deprecated: boolean;
}

/** Props for {@link ServerCard}. */
export interface ServerCardProps {
  server: ServerCardData;
  /** Index in the list, used to stagger the mount animation. */
  index?: number;
  className?: string;
}

/**
 * A server as it appears in a grid.
 *
 * The whole card is one link rather than a card containing links: nested
 * interactive elements are a persistent source of keyboard-navigation bugs,
 * and a single large target is easier to hit on a phone. Category chips are
 * therefore presentational here and filterable on the browse page instead.
 */
export function ServerCard({ server, index = 0, className }: ServerCardProps): React.JSX.Element {
  const primary = server.categories[0];
  const hue = primary ? categoryStyle(primary) : null;

  return (
    // CSS rather than a scroll-triggered animation: the card is visible the
    // moment the page paints, even without JavaScript, to crawlers, and in
    // full-page captures. A short stagger still lets a grid settle in.
    <article
      className={cn('animate-fade-up min-w-0 motion-reduce:animate-none', className)}
      style={{ animationDelay: `${Math.min(index * 40, 320)}ms` }}
    >
      <Link
        href={`/servers/${server.slug}`}
        className={cn(
          'group relative flex h-full flex-col overflow-hidden rounded-2xl',
          'bg-surface shadow-card border',
          'transition-[transform,box-shadow,border-color] duration-200 ease-out',
          'hover:border-hover hover:shadow-card-hover hover:-translate-y-0.5',
          server.deprecated && 'opacity-55',
        )}
      >
        {/* Category colour along the top edge: scannable, never the only cue. */}
        {hue && (
          <span
            aria-hidden
            className={cn(
              'absolute inset-x-0 top-0 h-0.5 opacity-70 transition-opacity group-hover:opacity-100',
              hue.dot,
            )}
          />
        )}

        <div className="relative flex items-start justify-between gap-4 p-5 pb-4">
          <div className="flex min-w-0 items-center gap-3">
            {server.authorAvatar ? (
              <Image
                src={server.authorAvatar}
                alt=""
                width={32}
                height={32}
                className="size-8 shrink-0 rounded-lg border object-cover"
              />
            ) : (
              <div className="bg-surface-hover size-8 shrink-0 rounded-lg border" />
            )}

            <div className="min-w-0">
              <h3 className="flex items-center gap-1.5 truncate font-medium leading-tight tracking-tight group-hover:underline group-hover:underline-offset-2">
                <span className="truncate">{server.name}</span>
                {server.verified && (
                  <BadgeCheck
                    className="text-accent size-3.5 shrink-0"
                    aria-label="Verified by MCPHub"
                  />
                )}
              </h3>
              {server.authorName && (
                <p className="text-text-muted mt-0.5 truncate font-mono text-xs">
                  {server.authorName}
                </p>
              )}
            </div>
          </div>

          <TrustScoreRing score={server.trustTotal} size={44} strokeWidth={3.5} />
        </div>

        <p className="text-text-secondary line-clamp-2 flex-1 px-5 text-sm leading-relaxed">
          {server.description}
        </p>

        <div className="flex flex-wrap items-center gap-1.5 px-5 pt-4">
          {server.isOfficial && <Badge variant="accent">Official</Badge>}
          {server.deprecated && <Badge variant="danger">Deprecated</Badge>}
          {server.categories.slice(0, 2).map((category) => (
            <span
              key={category}
              className={cn(
                'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
                categoryStyle(category).chip,
              )}
            >
              {CATEGORY_LABELS[category as Category] ?? category}
            </span>
          ))}
        </div>

        <div className="text-text-muted mt-4 flex items-center gap-3 border-t px-5 py-3 text-xs">
          <span className="inline-flex items-center gap-1">
            <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden />
            <span className="tabular-nums">{formatCount(server.githubStars)}</span>
            <span className="sr-only">GitHub stars</span>
          </span>

          {server.language && (
            <>
              <span aria-hidden className="opacity-40">
                ·
              </span>
              <span className="capitalize">{server.language}</span>
            </>
          )}

          <span className="ml-auto truncate font-mono">
            {formatRelativeTime(server.lastCommitAt)}
          </span>
        </div>
      </Link>
    </article>
  );
}

/** The card's loading placeholder, matching its exact dimensions. */
export function ServerCardSkeleton(): React.JSX.Element {
  return (
    <div className="bg-surface flex h-full flex-col rounded-xl border">
      <div className="flex items-start justify-between gap-4 p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-surface-hover size-8 animate-pulse rounded-lg" />
          <div className="space-y-1.5">
            <div className="bg-surface-hover h-3.5 w-28 animate-pulse rounded" />
            <div className="bg-surface-hover h-2.5 w-16 animate-pulse rounded" />
          </div>
        </div>
        <div className="bg-surface-hover size-11 animate-pulse rounded-full" />
      </div>

      <div className="space-y-2 px-5">
        <div className="bg-surface-hover h-3 w-full animate-pulse rounded" />
        <div className="bg-surface-hover h-3 w-4/5 animate-pulse rounded" />
      </div>

      <div className="flex gap-1.5 px-5 pt-4">
        <div className="bg-surface-hover h-5 w-16 animate-pulse rounded-md" />
        <div className="bg-surface-hover h-5 w-20 animate-pulse rounded-md" />
      </div>

      <div className="mt-4 border-t px-5 py-3">
        <div className="bg-surface-hover h-3 w-full animate-pulse rounded" />
      </div>
    </div>
  );
}
