import { CheckCircle2, Megaphone, ShieldCheck, TrendingUp } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { SpotlightForm } from '@/components/spotlight-form';
import { TrustPill } from '@/components/trust-pill';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cacheKey, cached } from '@/lib/cache';
import { formatRelativeTime } from '@/lib/format';
import { getActiveSponsors, type SponsorRow } from '@/lib/queries/spotlight';
import { safeQuery } from '@/lib/safe-query';
import {
  SPOTLIGHT_DAYS,
  SPOTLIGHT_MAX_CENTS,
  SPOTLIGHT_MIN_CENTS,
  SPOTLIGHT_STEP_CENTS,
  SPOTLIGHT_STRIP_SLOTS,
  formatUsd,
  getUsdInrRate,
  isSpotlightEnabled,
} from '@/lib/spotlight';

export const metadata: Metadata = {
  title: 'Spotlight — sponsor an MCP server',
  description:
    'Put your MCP server in front of every MCPHub visitor for a week. Clearly labelled, never affects Trust Score or rankings.',
  alternates: { canonical: '/spotlight' },
};

/** Next 15 passes search params as a promise. */
interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

/** The three facts a sponsor needs before paying. */
const HOW_IT_WORKS = [
  {
    icon: Megaphone,
    title: `${SPOTLIGHT_DAYS} days on the sponsor board`,
    text: 'Every purchase lists your server on this page for a week, guaranteed.',
  },
  {
    icon: TrendingUp,
    title: `Top ${SPOTLIGHT_STRIP_SLOTS} reach the homepage`,
    text: 'The highest combined bids get the homepage strip. Outbid to move up, or top up to hold your place.',
  },
  {
    icon: ShieldCheck,
    title: 'Scores stay independent',
    text: 'Sponsorship never touches the Trust Score, rankings or search. Your real score is shown beside you.',
  },
] as const;

/** Spotlight: the one paid surface on MCPHub, explained and sold in the open. */
export default async function SpotlightPage({
  searchParams,
}: PageProps): Promise<React.JSX.Element> {
  const { status } = await searchParams;
  const enabled = isSpotlightEnabled();

  const sponsors = await safeQuery('spotlight', [] as SponsorRow[], () =>
    cached(cacheKey('spotlight'), { ttl: 60 }, getActiveSponsors),
  );

  const lastStripSponsor = sponsors[SPOTLIGHT_STRIP_SLOTS - 1];
  const stripCents = lastStripSponsor
    ? Math.min(lastStripSponsor.totalCents + SPOTLIGHT_STEP_CENTS, SPOTLIGHT_MAX_CENTS)
    : SPOTLIGHT_MIN_CENTS;

  return (
    <main className="container py-8">
      <Breadcrumbs items={[{ label: 'Spotlight' }]} />

      {status === 'success' && (
        <div
          role="status"
          className="border-success/40 bg-success/5 mt-6 flex items-start gap-3 rounded-xl border p-4 text-sm"
        >
          <CheckCircle2 className="text-success mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            Payment received — thank you. Your placement goes live as soon as the payment is
            confirmed, usually within a minute. Razorpay emails your receipt.
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_24rem]">
        <div className="min-w-0">
          <header>
            <p className="eyebrow">Sponsored placements</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Spotlight</h1>
            <p className="text-text-secondary mt-3 max-w-prose leading-relaxed">
              Put your MCP server in front of every MCPHub visitor. It&apos;s the only thing on the
              site money can buy — and it&apos;s always labelled.
            </p>
          </header>

          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <li key={item.title} className="rounded-xl border p-4">
                <item.icon className="text-text-muted size-5" aria-hidden />
                <p className="mt-3 text-sm font-medium">{item.title}</p>
                <p className="text-text-muted mt-1 text-sm leading-relaxed">{item.text}</p>
              </li>
            ))}
          </ul>

          <section aria-labelledby="board" className="mt-12">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="board" className="text-xl font-semibold tracking-tight">
                Sponsor board
              </h2>
              <span className="text-text-muted text-sm">{sponsors.length} active</span>
            </div>

            {sponsors.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed p-10 text-center">
                <p className="font-medium">No sponsors right now</p>
                <p className="text-text-muted mt-1 text-sm">
                  The first bid of {formatUsd(SPOTLIGHT_MIN_CENTS)} takes the top spot.
                </p>
              </div>
            ) : (
              <ol className="mt-4 divide-y rounded-xl border">
                {sponsors.map((sponsor, index) => (
                  <li key={sponsor.slug} className="flex items-center gap-4 p-4">
                    <span className="text-text-muted w-6 font-mono text-sm tabular-nums">
                      {index + 1}
                    </span>
                    <Avatar className="size-9">
                      {sponsor.authorAvatar && <AvatarImage src={sponsor.authorAvatar} alt="" />}
                      <AvatarFallback>{sponsor.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/servers/${sponsor.slug}`}
                          rel="sponsored"
                          className="truncate font-medium hover:underline hover:underline-offset-2"
                        >
                          {sponsor.name}
                        </Link>
                        {index < SPOTLIGHT_STRIP_SLOTS && <Badge variant="outline">Homepage</Badge>}
                      </div>
                      <p className="text-text-muted truncate text-xs">
                        {formatUsd(sponsor.totalCents)} · ends {formatRelativeTime(sponsor.endsAt)}
                      </p>
                    </div>
                    <TrustPill score={sponsor.trustTotal} />
                  </li>
                ))}
              </ol>
            )}
          </section>

          <p className="text-text-muted mt-8 text-xs leading-relaxed">
            Eligible: indexed, not deprecated, and no unresolved critical security findings. We can
            end a placement early if a server turns out to be unsafe or misleading, and refund the
            unused days. Read the{' '}
            <Link href="/legal/sponsored" className="underline underline-offset-2">
              sponsored content policy
            </Link>{' '}
            and{' '}
            <Link href="/legal/terms#spotlight" className="underline underline-offset-2">
              terms
            </Link>
            .
          </p>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="panel rounded-2xl p-6">
            <h2 className="font-semibold tracking-tight">Place a bid</h2>
            {enabled ? (
              <div className="mt-5">
                <SpotlightForm
                  stripCents={stripCents}
                  minCents={SPOTLIGHT_MIN_CENTS}
                  maxCents={SPOTLIGHT_MAX_CENTS}
                  days={SPOTLIGHT_DAYS}
                  usdInr={getUsdInrRate()}
                />
              </div>
            ) : (
              <p className="text-text-muted mt-2 text-sm leading-relaxed">
                Spotlight isn&apos;t open yet. Check back soon — or{' '}
                <Link href="/badges" className="underline underline-offset-2">
                  add a free Trust Score badge
                </Link>{' '}
                to your README in the meantime.
              </p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
