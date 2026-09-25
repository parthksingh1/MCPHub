import { computeAwards } from '@mcphub/scoring';
import { CATEGORY_LABELS, type Category } from '@mcphub/shared';
import { BadgeCheck, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { TrustedMark } from '@/components/awards';
import { TrustScoreRing } from '@/components/trust-score-ring';
import { Badge } from '@/components/ui/badge';
import { formatCount, formatRelativeTime } from '@/lib/format';
import { languageColor, languageLabel } from '@/lib/language-colors';
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
 * Logo, name and author up top with the Trust Score ring beside them, a
 * two-line description, category tags, and a footer of stars, language and
 * last activity. The ring is the only strong colour, and it means something:
 * green, amber or red by trust band.
 *
 * The whole card is one link rather than a card containing links: nested
 * interactive elements are a persistent source of keyboard-navigation bugs,
 * and a single large target is easier to hit on a phone.
 */
export function ServerCard({ server, index = 0, className }: ServerCardProps): React.JSX.Element {
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
          'group flex h-full flex-col overflow-hidden rounded-xl border',
          'bg-surface shadow-card transition-[border-color,box-shadow] duration-200',
          'hover:border-hover hover:shadow-card-hover',
          server.deprecated && 'opacity-60',
        )}
      >
        <div className="flex items-start justify-between gap-4 p-5 pb-3">
          <div className="flex min-w-0 items-center gap-3">
            {server.authorAvatar ? (
              <Image
                src={server.authorAvatar}
                alt=""
                width={36}
                height={36}
                className="bg-surface-hover size-9 shrink-0 rounded-lg border object-cover"
              />
            ) : (
              <div className="bg-surface-hover text-text-muted flex size-9 shrink-0 items-center justify-center rounded-lg border font-mono text-sm uppercase">
                {server.name.slice(0, 1)}
              </div>
            )}

            <div className="min-w-0">
              <h3 className="flex items-center gap-1.5 font-semibold leading-tight tracking-tight group-hover:underline group-hover:underline-offset-2">
                <span className="truncate">{server.name}</span>
                {server.verified && (
                  <BadgeCheck
                    className="text-accent size-4 shrink-0"
                    aria-label="Verified by MCPHub"
                  />
                )}
                {trusted && <TrustedMark compact />}
              </h3>
              <p className="text-text-muted mt-0.5 truncate font-mono text-xs">
                {server.authorName ?? 'unknown'}
              </p>
            </div>
          </div>

          <TrustScoreRing score={server.trustTotal} size={46} strokeWidth={3.5} />
        </div>

        <p className="text-text-secondary line-clamp-2 flex-1 px-5 text-sm leading-relaxed">
          {server.description}
        </p>

        <div className="flex flex-wrap items-center gap-1.5 px-5 pt-4">
          {server.isOfficial && <Badge variant="accent">Official</Badge>}
          {server.deprecated && <Badge variant="danger">Deprecated</Badge>}
          {server.categories.slice(0, 2).map((slug) => (
            <Badge key={slug} variant="outline">
              {CATEGORY_LABELS[slug as Category] ?? slug}
            </Badge>
          ))}
        </div>

        <div className="text-text-muted mt-4 flex items-center gap-3 border-t px-5 py-3 text-xs">
          <span className="inline-flex shrink-0 items-center gap-1">
            <Star className="size-3.5" aria-hidden />
            <span className="tabular-nums">{formatCount(server.githubStars)}</span>
            <span className="sr-only">GitHub stars</span>
          </span>

          {server.language && (
            <span className="inline-flex shrink-0 items-center gap-1.5">
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ backgroundColor: languageColor(server.language) }}
              />
              {languageLabel(server.language)}
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
