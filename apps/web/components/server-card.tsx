'use client';

import { CATEGORY_LABELS, type Category } from '@mcphub/shared';
import { motion, useReducedMotion } from 'framer-motion';
import { BadgeCheck, GitFork, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { TrustScoreRing } from '@/components/trust-score-ring';
import { Badge } from '@/components/ui/badge';
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
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.25,
        // A 30ms stagger reads as the list settling into place; much more and
        // it starts to feel like the page is slow.
        delay: reduceMotion ? 0 : Math.min(index * 0.03, 0.3),
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      <Link
        href={`/servers/${server.slug}`}
        className={cn(
          'bg-surface group relative flex h-full flex-col rounded-lg border p-5',
          'transition-all duration-200 ease-out',
          'hover:border-hover hover:bg-surface-hover hover:shadow-card hover:-translate-y-0.5',
          server.deprecated && 'opacity-60',
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2.5">
            {server.authorAvatar ? (
              <Image
                src={server.authorAvatar}
                alt=""
                width={28}
                height={28}
                className="size-7 shrink-0 rounded-full border"
              />
            ) : (
              <div className="bg-surface-hover size-7 shrink-0 rounded-full border" />
            )}

            <div className="min-w-0">
              <h3 className="flex items-center gap-1.5 truncate font-medium leading-tight">
                <span className="truncate">{server.name}</span>
                {server.verified && (
                  <BadgeCheck
                    className="text-accent size-3.5 shrink-0"
                    aria-label="Verified by MCPHub"
                  />
                )}
              </h3>
              {server.authorName && (
                <p className="text-text-muted truncate text-xs">{server.authorName}</p>
              )}
            </div>
          </div>

          <TrustScoreRing score={server.trustTotal} size={44} strokeWidth={3} />
        </div>

        <p className="text-text-secondary mt-3 line-clamp-2 flex-1 text-sm leading-relaxed">
          {server.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {server.isOfficial && <Badge variant="accent">Official</Badge>}
          {server.deprecated && <Badge variant="danger">Deprecated</Badge>}
          {server.categories.slice(0, 2).map((category) => (
            <Badge key={category}>{CATEGORY_LABELS[category as Category] ?? category}</Badge>
          ))}
        </div>

        <div className="text-text-muted mt-4 flex items-center gap-4 border-t pt-3 text-xs">
          <span className="inline-flex items-center gap-1">
            <Star className="size-3.5" aria-hidden />
            <span className="tabular-nums">{formatCount(server.githubStars)}</span>
            <span className="sr-only">GitHub stars</span>
          </span>

          {server.language && (
            <span className="inline-flex items-center gap-1 capitalize">
              <GitFork className="size-3.5" aria-hidden />
              {server.language}
            </span>
          )}

          <span className="ml-auto truncate">
            updated {formatRelativeTime(server.lastCommitAt)}
          </span>
        </div>
      </Link>
    </motion.article>
  );
}

/** The card's loading placeholder, matching its exact dimensions. */
export function ServerCardSkeleton(): React.JSX.Element {
  return (
    <div className="bg-surface flex h-full flex-col rounded-lg border p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="bg-surface-hover size-7 animate-pulse rounded-full" />
          <div className="space-y-1.5">
            <div className="bg-surface-hover h-3.5 w-28 animate-pulse rounded" />
            <div className="bg-surface-hover h-2.5 w-16 animate-pulse rounded" />
          </div>
        </div>
        <div className="bg-surface-hover size-11 animate-pulse rounded-full" />
      </div>

      <div className="mt-4 space-y-2">
        <div className="bg-surface-hover h-3 w-full animate-pulse rounded" />
        <div className="bg-surface-hover h-3 w-4/5 animate-pulse rounded" />
      </div>

      <div className="mt-4 flex gap-1.5">
        <div className="bg-surface-hover h-5 w-16 animate-pulse rounded-sm" />
        <div className="bg-surface-hover h-5 w-20 animate-pulse rounded-sm" />
      </div>

      <div className="bg-surface-hover mt-4 h-3 w-full animate-pulse rounded border-t" />
    </div>
  );
}
