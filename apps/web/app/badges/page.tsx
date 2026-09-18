import { AWARD_IDS, AWARDS } from '@mcphub/scoring';
import { TRUST_BANDS, TRUST_MAX_TOTAL } from '@mcphub/shared';
import { ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AWARD_ICON, TrustedMark } from '@/components/awards';
import { BadgeBuilder } from '@/components/badge-builder';
import { Breadcrumbs } from '@/components/breadcrumbs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { BADGE_COLOURS, BADGE_STYLES, renderBadge } from '@/lib/badge';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'MCPHub badges',
  description:
    'The MCPHub badges an MCP server can earn — MCPHub Trusted, Security clean, Top rated and more — and how to embed them in your README.',
  alternates: { canonical: '/badges' },
};

/** An inline preview of a rendered badge, as a data URI image. */
function Preview({ svg, alt }: { svg: string; alt: string }): React.JSX.Element {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`} alt={alt} />;
}

/** What each badge colour means, so a reader of a README can interpret it. */
const MEANINGS = [
  {
    colour: BADGE_COLOURS.high,
    message: `${TRUST_BANDS.high}/${TRUST_MAX_TOTAL}`,
    text: `${TRUST_BANDS.high} and above — well maintained, documented and scanned clean.`,
  },
  {
    colour: BADGE_COLOURS.medium,
    message: `${TRUST_BANDS.medium}/${TRUST_MAX_TOTAL}`,
    text: `${TRUST_BANDS.medium}–${TRUST_BANDS.high - 1} — usable, with gaps worth checking.`,
  },
  {
    colour: BADGE_COLOURS.low,
    message: `${TRUST_BANDS.medium - 1}/${TRUST_MAX_TOTAL}`,
    text: `Below ${TRUST_BANDS.medium} — review before installing.`,
  },
  {
    colour: BADGE_COLOURS.unknown,
    message: 'not indexed',
    text: 'The slug is not in the index yet, or the service is briefly unavailable.',
  },
] as const;

/** Badges page: explains the embed and generates snippets. */
export default function BadgesPage(): React.JSX.Element {
  return (
    <main className="container max-w-4xl py-8">
      <Breadcrumbs items={[{ label: 'Badges' }]} />

      <header className="mt-6">
        <p className="eyebrow">Earned, never bought</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">MCPHub badges</h1>
        <p className="text-text-secondary mt-3 max-w-prose leading-relaxed">
          Servers earn badges automatically when they meet public, published rules — built on the
          open{' '}
          <Link href="/trust-score" className="underline underline-offset-2">
            Trust Score
          </Link>{' '}
          and our security scans. Maintainers can show them off with a live README badge that
          updates on its own. Free, no sign-up, no tracking.
        </p>
      </header>

      <section aria-labelledby="awards-title" id="awards" className="mt-10 scroll-mt-24">
        <h2 id="awards-title" className="text-xl font-semibold tracking-tight">
          Badges a server can earn
        </h2>
        <p className="text-text-muted mt-1 max-w-prose text-sm leading-relaxed">
          Every badge is earned automatically from public data and rechecked daily. None can be
          bought, requested, or granted by sponsorship — these are the exact rules.
        </p>

        {/* The flagship badge, given the room it deserves. */}
        <div className="bg-surface mt-6 rounded-2xl border p-6">
          <div className="flex flex-wrap items-start gap-4">
            <span className="bg-accent/10 text-accent flex size-12 shrink-0 items-center justify-center rounded-xl">
              <ShieldCheck className="size-6" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold tracking-tight">{AWARDS.trusted.label}</h3>
                <TrustedMark />
              </div>
              <p className="text-text-secondary mt-1.5 max-w-prose text-sm leading-relaxed">
                The badge that answers “can I install this?”. {AWARDS.trusted.criteria}
              </p>
            </div>
            <Preview
              svg={renderBadge('mcphub', '✓ trusted', BADGE_COLOURS.high)}
              alt="MCPHub Trusted README badge"
            />
          </div>
        </div>

        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {AWARD_IDS.filter((id) => id !== 'trusted').map((id) => {
            const Icon = AWARD_ICON[id];
            return (
              <li key={id} className="flex gap-3 rounded-xl border p-4">
                <span className="bg-surface-hover text-text-secondary flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">{AWARDS[id].label}</h3>
                  <p className="text-text-muted mt-1 text-sm leading-relaxed">
                    {AWARDS[id].criteria}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="text-text-muted mt-4 text-xs leading-relaxed">
          Badges are automated signals about public data, not a security audit or a guarantee.
          Always review what you install. See the{' '}
          <Link href="/legal/terms#trust-score" className="underline underline-offset-2">
            terms
          </Link>
          .
        </p>
      </section>

      <section aria-labelledby="builder" className="panel mt-12 rounded-2xl p-6">
        <h2 id="builder" className="font-semibold tracking-tight">
          Get your snippet
        </h2>
        <p className="text-text-muted mb-5 mt-1 text-sm">
          Find your server on MCPHub, then paste its slug below.
        </p>
        <BadgeBuilder siteUrl={SITE_URL} />
      </section>

      <section aria-labelledby="styles" className="mt-12">
        <h2 id="styles" className="text-xl font-semibold tracking-tight">
          Styles
        </h2>
        <p className="text-text-muted mt-1 text-sm">
          Add <code className="font-mono">?style=</code> to the badge URL to match the other badges
          in your README.
        </p>
        <div className="mt-5 divide-y rounded-xl border">
          {BADGE_STYLES.map((style) => (
            <div key={style} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <Preview
                svg={renderBadge('trust score', `86/${TRUST_MAX_TOTAL}`, BADGE_COLOURS.high, style)}
                alt={`${style} style badge`}
              />
              <code className="text-text-muted font-mono text-xs">
                {style === 'flat' ? '(default)' : `?style=${style}`}
              </code>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="colours" className="mt-12">
        <h2 id="colours" className="text-xl font-semibold tracking-tight">
          What the colours mean
        </h2>
        <ul className="mt-5 space-y-3">
          {MEANINGS.map((item) => (
            <li key={item.message} className="flex flex-wrap items-center gap-4">
              <span className="w-32 shrink-0">
                <Preview
                  svg={renderBadge('trust score', item.message, item.colour)}
                  alt={`Badge reading ${item.message}`}
                />
              </span>
              <span className="text-text-secondary text-sm">{item.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="faq" className="mt-12">
        <h2 id="faq" className="text-xl font-semibold tracking-tight">
          Questions
        </h2>
        <Accordion type="single" collapsible className="mt-4">
          <AccordionItem value="update">
            <AccordionTrigger>How often does the badge update?</AccordionTrigger>
            <AccordionContent>
              Scores are recomputed daily. GitHub caches README images on its own proxy, so a new
              score can take a few hours to show on github.com.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="track">
            <AccordionTrigger>Does the badge track my visitors?</AccordionTrigger>
            <AccordionContent>
              No. It is a static SVG with no cookies or scripts, and GitHub serves it through its
              own image proxy, so we never see who views your README. See the{' '}
              <Link href="/legal/privacy" className="underline underline-offset-2">
                privacy policy
              </Link>
              .
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="low">
            <AccordionTrigger>My score is lower than I expected. What can I do?</AccordionTrigger>
            <AccordionContent>
              The{' '}
              <Link href="/trust-score" className="underline underline-offset-2">
                Trust Score methodology
              </Link>{' '}
              lists every signal and its weight — each one is something a maintainer can improve. If
              you think the data is wrong, use the report link on your server&apos;s page.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="buy">
            <AccordionTrigger>Can I pay to raise my score?</AccordionTrigger>
            <AccordionContent>
              No. Scores and rankings cannot be bought. Paid{' '}
              <Link href="/spotlight" className="underline underline-offset-2">
                Spotlight
              </Link>{' '}
              placements are separate, always labelled as sponsored, and have no effect on the
              score.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </main>
  );
}
