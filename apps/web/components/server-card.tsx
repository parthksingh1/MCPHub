import { computeAwards } from '@mcphub/scoring';
import { CATEGORY_LABELS, type Category } from '@mcphub/shared';
import { BadgeCheck, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { TrustedMark } from '@/components/awards';
import { TrustPill } from '@/components/trust-pill';
import { formatCount, formatRelativeTime } from '@/lib/format';
import { languageColor } from '@/lib/language-colors';
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
  /** Badge inputs. Optional so callers without them simply show no mark. */
  trustPrevious?: number | null;
  license?: string | null;
  scanClean?: boolean;
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
 * Deliberately monochrome, in the manner of the Vercel and Raycast
 * marketplaces: logo, name, one line of provenance, a two-line description and
 * a quiet metadata row. The only colours are the ones that mean something —
 * the Trust Score dot and GitHub's language dot.
 *
 * The whole card is one link rather than a card containing links: nested
 * interactive elements are a persistent source of keyboard-navigation bugs,
 * and a single large target is easier to hit on a phone.
 */
export function ServerCard({ server, index = 0, className }: ServerCardProps): React.JSX.Element {
  const category = server.categories[0] as Category | undefined;
  const trusted = computeAwards({
    trustTotal: server.trustTotal,
    trustPrevious: server.trustPrevious ?? null,
    lastCommitAt: server.lastCommitAt,
    license: server.license ?? null,
    githubStars: server.githubStars,
    isOfficial: server.isOfficial,
    verified: server.verified,
    deprecated: server.deprecated,
    scanClean: server.scanClean ?? false,
  }).includes('trusted');

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
          'group flex h-full flex-col rounded-xl border p-5',
          'bg-surface transition-colors duration-200',
          'hover:border-hover hover:bg-surface-hover/50',
          server.deprecated && 'opacity-60',
        )}
      >
        <div className="flex items-start gap-3">
          {server.authorAvatar ? (
            <Image
              src={server.authorAvatar}
              alt=""
              width={40}
              height={40}
              className="bg-surface-hover size-10 shrink-0 rounded-lg border object-cover"
            />
          ) : (
            <div className="bg-surface-hover text-text-muted flex size-10 shrink-0 items-center justify-center rounded-lg border font-mono text-sm uppercase">
              {server.name.slice(0, 1)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="flex items-center gap-1.5 font-semibold leading-snug tracking-tight">
              <span className="truncate">{server.name}</span>
              {server.verified && (
                <BadgeCheck
                  className="text-accent size-4 shrink-0"
                  aria-label="Verified by MCPHub"
                />
              )}
              {trusted && <TrustedMark />}
            </h3>
            <p className="text-text-muted mt-0.5 truncate text-xs">
              {server.isOfficial ? 'Official · ' : ''}
              {server.authorName ?? 'Unknown author'}
              {category && ` · ${CATEGORY_LABELS[category] ?? category}`}
            </p>
          </div>

          <TrustPill score={server.trustTotal} />
        </div>

        <p className="text-text-secondary mt-4 line-clamp-2 flex-1 text-sm leading-relaxed">
          {server.description}
        </p>

        <div className="text-text-muted mt-5 flex items-center gap-3 text-xs">
          {server.deprecated && <span className="text-danger font-medium">Deprecated</span>}

          <span className="inline-flex shrink-0 items-center gap-1">
            <Star className="size-3.5" aria-hidden />
            <span className="tabular-nums">{formatCount(server.githubStars)}</span>
            <span className="sr-only">GitHub stars</span>
          </span>

          {server.language && (
            <span className="inline-flex shrink-0 items-center gap-1.5 capitalize">
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ backgroundColor: languageColor(server.language) }}
              />
              {server.language}
            </span>
          )}

          <span className="ml-auto shrink-0">{formatRelativeTime(server.lastCommitAt)}</span>
        </div>
      </Link>
    </article>
  );
}

/** The card's loading placeholder, matching its exact dimensions. */
export function ServerCardSkeleton(): React.JSX.Element {
  return (
    <div className="bg-surface flex h-full flex-col rounded-xl border p-5">
      <div className="flex items-start gap-3">
        <div className="bg-surface-hover size-10 animate-pulse rounded-lg" />
        <div className="flex-1 space-y-1.5">
          <div className="bg-surface-hover h-3.5 w-28 animate-pulse rounded" />
          <div className="bg-surface-hover h-2.5 w-16 animate-pulse rounded" />
        </div>
        <div className="bg-surface-hover h-7 w-14 animate-pulse rounded-full" />
      </div>

      <div className="mt-4 space-y-2">
        <div className="bg-surface-hover h-3 w-full animate-pulse rounded" />
        <div className="bg-surface-hover h-3 w-4/5 animate-pulse rounded" />
      </div>

      <div className="bg-surface-hover mt-5 h-3 w-2/3 animate-pulse rounded" />
    </div>
  );
}
