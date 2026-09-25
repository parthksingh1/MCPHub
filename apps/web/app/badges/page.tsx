import { AWARD_IDS, AWARDS, STICKER_TIERS, STICKERS } from '@mcphub/scoring';
import { TRUST_BANDS, TRUST_MAX_TOTAL } from '@mcphub/shared';
import type { Metadata } from 'next';
import Link from 'next/link';

import { BadgeBuilder } from '@/components/badge-builder';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Medal } from '@/components/medal';
import { Sticker } from '@/components/sticker';
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
        {/* The flagship medal, given the stage it deserves. */}
        <div className="bg-surface relative overflow-hidden rounded-3xl border p-8 sm:p-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(420px 260px at 18% 40%, rgba(234,179,8,0.14), transparent 70%), radial-gradient(420px 260px at 90% 0%, hsl(var(--accent) / 0.12), transparent 70%)',
            }}
          />
          <div className="relative flex flex-col items-center gap-8 sm:flex-row">
            <Medal award="trusted" size={150} className="shrink-0" />
            <div className="text-center sm:text-left">
              <p className="eyebrow">The top honour</p>
              <h2 id="awards-title" className="mt-2 text-2xl font-semibold tracking-tight">
                {AWARDS.trusted.label}
              </h2>
              <p className="text-text-secondary mt-3 max-w-prose leading-relaxed">
                The badge that answers “can I install this?”. {AWARDS.trusted.criteria}
              </p>
            </div>
          </div>
        </div>

        <h2 className="mt-14 text-xl font-semibold tracking-tight">Collect them all</h2>
        <p className="text-text-muted mt-1 max-w-prose text-sm leading-relaxed">
          Every badge is earned automatically from public data and rechecked daily. None can be
          bought, requested, or granted by sponsorship — these are the exact rules.
        </p>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {AWARD_IDS.filter((id) => id !== 'trusted').map((id) => (
            <li key={id} className="bg-surface flex items-center gap-5 rounded-2xl border p-5">
              <Medal
                award={id}
                tier={id === 'popular' ? 'gold' : null}
                size={76}
                className="shrink-0"
              />
              <div className="min-w-0">
                <h3 className="font-semibold">{AWARDS[id].label}</h3>
                <p className="text-text-muted mt-1 text-sm leading-relaxed">
                  {AWARDS[id].criteria}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {/* Popular levels up, like a season badge. */}
        <div className="mt-6 rounded-2xl border p-6">
          <h3 className="font-semibold">Popular levels up</h3>
          <p className="text-text-muted mt-1 text-sm">
            Bronze at 1,000 stars, silver at 10,000, gold at 50,000.
          </p>
          <div className="mt-5 flex flex-wrap items-end justify-center gap-6 sm:justify-start">
            {(['bronze', 'silver', 'gold'] as const).map((tier) => (
              <div key={tier} className="flex flex-col items-center">
                <Medal award="popular" tier={tier} size={84} />
                <span className="text-text-muted mt-2 text-xs capitalize">{tier}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border p-6">
          <h3 className="font-semibold">Show your medals in your README</h3>
          <p className="text-text-muted mt-1 text-sm leading-relaxed">
            Each medal is a live image. It shows in colour only while your server holds the badge,
            and turns grey if it is lost — so it can never be faked. Replace{' '}
            <code className="font-mono">your-server</code> with your slug and pick a badge.
          </p>
          <pre className="bg-background mt-4 overflow-x-auto rounded-xl border p-3 font-mono text-xs leading-relaxed">
            <code>{`<a href="${SITE_URL}/servers/your-server"><img src="${SITE_URL}/api/award/your-server/trusted" width="120" alt="MCPHub Trusted" /></a>`}</code>
          </pre>
          <p className="text-text-muted mt-3 text-xs">Badge names: {AWARD_IDS.join(', ')}.</p>
        </div>

        <p className="text-text-muted mt-4 text-xs leading-relaxed">
          Badges are automated signals about public data, not a security audit or a guarantee.
          Always review what you install. See the{' '}
          <Link href="/legal/terms#trust-score" className="underline underline-offset-2">
            terms
          </Link>
          .
        </p>
      </section>

      <section aria-labelledby="stickers-title" id="stickers" className="mt-14 scroll-mt-24">
        <h2 id="stickers-title" className="text-xl font-semibold tracking-tight">
          Score stickers
        </h2>
        <p className="text-text-muted mt-1 max-w-prose text-sm leading-relaxed">
          Separate from the badges: every server that scores 70 or more earns a sticker for its
          Trust Score, from silver Solid to a holographic Perfect 100. Hover one to peel it.
        </p>
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
          {STICKER_TIERS.map((tier) => (
            <li key={tier} className="flex flex-col items-center text-center">
              <Sticker tier={tier} size={128} />
              <h3 className="mt-4 font-semibold">{STICKERS[tier].label}</h3>
              <p className="text-text-muted mt-1 text-xs">{STICKERS[tier].criteria}</p>
            </li>
          ))}
        </ul>
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
