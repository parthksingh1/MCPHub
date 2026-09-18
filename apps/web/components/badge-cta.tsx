import { getTrustBand } from '@mcphub/scoring';
import Link from 'next/link';

import { BadgeBuilder } from '@/components/badge-builder';
import { cn } from '@/lib/utils';

/** Props for {@link BadgeCta}. */
export interface BadgeCtaProps {
  slug: string;
  name: string;
  trustTotal: number;
  /** Canonical origin, passed from the server so it is correct in every env. */
  siteUrl: string;
  className?: string;
}

/**
 * Invites a maintainer to embed their Trust Score badge.
 *
 * This is the distribution loop: a maintainer who scores well puts the badge in
 * their README, and every visitor to that repository sees MCPHub — the same
 * mechanic that grew Shields.io, except earned rather than bought.
 *
 * Shown only for servers scoring in the top two bands. Asking someone to
 * advertise a low score is both futile and slightly insulting.
 */
export function BadgeCta({
  slug,
  name,
  trustTotal,
  siteUrl,
  className,
}: BadgeCtaProps): React.JSX.Element | null {
  if (getTrustBand(trustTotal) === 'low') return null;

  return (
    <section className={cn('panel rounded-2xl p-6', className)}>
      <p className="eyebrow">For maintainers</p>
      <h2 className="mt-1.5 font-semibold tracking-tight">
        Scoring {trustTotal}/100? Show it off.
      </h2>
      <p className="text-text-muted mb-5 mt-1.5 text-sm leading-relaxed">
        Add the badge to {name}&apos;s README. It updates automatically as the score changes.{' '}
        <Link href="/badges" className="hover:text-foreground underline underline-offset-2">
          All badge options
        </Link>
      </p>
      <BadgeBuilder siteUrl={siteUrl} slug={slug} name={name} />
    </section>
  );
}
