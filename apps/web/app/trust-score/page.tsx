import { TRUST_BANDS } from '@mcphub/shared';
import type { Metadata } from 'next';
import Link from 'next/link';

import { TrustScoreRing } from '@/components/trust-score-ring';

export const revalidate = 86_400;

export const metadata: Metadata = {
  title: 'How the Trust Score works',
  description:
    'MCPHub scores every MCP server 0-100 across maintenance, popularity, security, and quality. The algorithm is open source and deterministic.',
  alternates: { canonical: '/trust-score' },
};

/** The four components, with their exact published rules. */
const COMPONENTS = [
  {
    name: 'Maintenance',
    question: 'Is anyone still looking after this?',
    rules: [
      'Last commit within 30 days: +15',
      'Last commit within 90 days: +10',
      'Last commit within 180 days: +5',
      'A release in the last 90 days: +10',
      'More than 50 open issues on a repo with no commit in 90 days: −5',
    ],
    why: 'An abandoned server is the most common way an MCP setup breaks. Commit recency predicts that better than any other single signal.',
  },
  {
    name: 'Popularity',
    question: 'Has the ecosystem actually adopted this?',
    rules: [
      'Stars, on a log scale: min(25, floor(log₁₀(stars + 1) × 6))',
      'Published by a recognised first-party vendor: +5',
      'More than 1,000 weekly npm downloads: +3',
    ],
    why: 'Logarithmic, not linear. The gap between 10 and 100 stars means far more than the gap between 10,000 and 10,090 — a linear scale would flatten every small project into noise.',
  },
  {
    name: 'Security',
    question: 'What did the scanner find?',
    rules: [
      'Starts at 25, reduced by findings',
      'Critical finding: −25 each',
      'High: −10 · Medium: −5 · Low: −2',
      'Critical dependency advisory: −10 · High: −5 · Medium: −2',
      'Floors at 0',
    ],
    why: 'A single critical finding zeroes this component outright. "Mostly safe" is not a useful thing to tell someone about to give a program shell access to their own machine.',
  },
  {
    name: 'Quality',
    question: 'Was this built carefully?',
    rules: [
      'README longer than 500 characters: +5',
      'A LICENSE file: +5',
      'TypeScript types or Python type hints: +5',
      'A tests directory: +5',
      'CI configured: +5',
    ],
    why: 'None of these prove the code is good. Together they show whether the author was working carefully — and each is cheap to detect and hard to fake.',
  },
] as const;

/** The public explainer for the Trust Score. */
export default function TrustScorePage(): React.JSX.Element {
  return (
    <main className="container py-10">
      <h1 className="text-3xl font-semibold tracking-tight">How the Trust Score works</h1>

      <p className="text-text-secondary mt-4 max-w-prose text-lg leading-relaxed">
        Every server gets a single number from 0 to 100, built from four equally weighted parts of
        25 points each. The algorithm is deterministic and open source — you can read it, run it,
        and disagree with it.
      </p>

      {/* Bands */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { score: 88, label: 'Trusted', detail: `${TRUST_BANDS.high} and above` },
          {
            score: 62,
            label: 'Reasonable',
            detail: `${TRUST_BANDS.medium}–${TRUST_BANDS.high - 1}`,
          },
          { score: 31, label: 'Use with caution', detail: `Below ${TRUST_BANDS.medium}` },
        ].map((band) => (
          <div
            key={band.label}
            className="bg-surface flex items-center gap-4 rounded-lg border p-5"
          >
            <TrustScoreRing score={band.score} size={52} strokeWidth={4} />
            <div>
              <p className="font-medium">{band.label}</p>
              <p className="text-text-muted text-xs">{band.detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Components */}
      <div className="mt-12 space-y-6">
        {COMPONENTS.map((component, index) => (
          <section key={component.name} className="panel gradient-border rounded-2xl p-6 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              <div>
                <p className="eyebrow">0{index + 1} — 0-25 points</p>
                <h2 className="text-section-title mt-2 font-semibold">{component.name}</h2>
                <p className="text-text-secondary mt-2 text-sm">{component.question}</p>
                <p className="text-text-muted mt-5 max-w-prose border-t pt-5 text-sm leading-relaxed">
                  {component.why}
                </p>
              </div>

              <ul className="space-y-2 self-start rounded-xl border p-4">
                {component.rules.map((rule) => (
                  <li
                    key={rule}
                    className="text-text-secondary flex gap-2.5 font-mono text-xs leading-relaxed"
                  >
                    <span className="text-accent select-none" aria-hidden>
                      ›
                    </span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>

      {/* Honesty section — matters more than the algorithm itself. */}
      <section className="mt-12 max-w-prose">
        <h2 className="text-xl font-semibold tracking-tight">What the score does not tell you</h2>
        <div className="text-text-secondary mt-4 space-y-4 text-sm leading-relaxed">
          <p>
            <strong className="text-foreground">
              An unscanned server keeps its full 25 security points.
            </strong>{' '}
            That is not a clean bill of health — it means we have not looked yet. Every server page
            says plainly whether it has been scanned, and you should read that before you read the
            number.
          </p>
          <p>
            <strong className="text-foreground">A high score is not an endorsement.</strong> It
            means a repository is actively maintained, widely used, passes automated checks, and
            looks carefully built. It cannot tell you whether the code does what it claims, and no
            static analysis can.
          </p>
          <p>
            <strong className="text-foreground">A low score is not an accusation.</strong> A new
            server by a careful author starts with almost no stars and no release history, and
            scores accordingly. Popularity is a lagging indicator.
          </p>
          <p>
            MCP servers run on your machine, with your permissions, and act on instructions that may
            ultimately come from text a model has read somewhere. Read the source of anything you
            install. The Trust Score is a filter, not a substitute for that.
          </p>
        </div>

        <p className="text-text-muted mt-6 text-sm">
          The implementation lives in{' '}
          <a
            href="https://github.com/mcphub/mcphub/tree/main/packages/scoring"
            target="_blank"
            rel="noreferrer noopener"
            className="text-accent underline underline-offset-2"
          >
            packages/scoring
          </a>
          , with full test coverage. Think a weight is wrong?{' '}
          <a
            href="https://github.com/mcphub/mcphub/issues/new"
            target="_blank"
            rel="noreferrer noopener"
            className="text-accent underline underline-offset-2"
          >
            Open an issue
          </a>
          .
        </p>

        <Link
          href="/servers?sort=trust"
          className="text-accent mt-8 inline-block text-sm transition-opacity hover:opacity-80"
        >
          Browse servers by Trust Score →
        </Link>
      </section>
    </main>
  );
}
