import { TRUST_BANDS } from '@mcphub/shared';
import { Activity, ArrowRight, Award, Check, ShieldCheck, Star } from 'lucide-react';
import Link from 'next/link';

import { InstallTerminal } from '@/components/install-demo';
import { Medal } from '@/components/medal';
import type { IndexInsights } from '@/lib/queries/servers';
import { cn } from '@/lib/utils';

/** The four Trust Score components, in the order the algorithm sums them. */
const PARTS = [
  { name: 'Maintenance', detail: 'Commit and release recency', icon: Activity },
  { name: 'Popularity', detail: 'Stars, on a log scale', icon: Star },
  { name: 'Security', detail: 'Semgrep scan and dependency audit', icon: ShieldCheck },
  { name: 'Quality', detail: 'README, licence, types, tests, CI', icon: Award },
] as const;

/** What the purpose-built Semgrep ruleset looks for (see semgrep-rules/). */
const SCAN_CHECKS = [
  'Shell and command injection',
  'Dynamic eval of untrusted input',
  'Path traversal on file writes',
  'Hard-coded secrets and tokens',
  'Disabled TLS verification',
  'Wide-open CORS',
];

/** One bento tile: a quiet surface with a heading block and free-form body. */
function Tile({
  title,
  detail,
  className,
  children,
}: {
  title: string;
  detail: string;
  className?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div
      className={cn(
        'bg-surface shadow-tile relative flex min-w-0 flex-col overflow-hidden rounded-2xl border p-6 sm:p-7',
        className,
      )}
    >
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="text-text-muted mt-1 max-w-[46ch] text-[15px] leading-relaxed">{detail}</p>
      <div className="mt-6 flex flex-1 flex-col justify-end">{children}</div>
    </div>
  );
}

/**
 * "Everything you need to install with confidence" — the product, in tiles.
 *
 * A bento rather than a row of equal cards: tile sizes follow how much there
 * is to show, and each tile contains a real piece of the product (the score
 * breakdown, the scan rules, live index numbers, the install snippets, the
 * medals) instead of an icon and a sentence.
 */
export function FeatureBento({ insights }: { insights: IndexInsights | null }): React.JSX.Element {
  const total = insights?.total ?? 0;
  const pct = (n: number): string => (total > 0 ? `${Math.round((n / total) * 100)}%` : '—');
  const peak = Math.max(...(insights?.distribution ?? [1]), 1);

  return (
    <section className="container py-24" aria-labelledby="bento-heading">
      <div className="max-w-2xl">
        <p className="eyebrow">Why MCPHub</p>
        <h2 id="bento-heading" className="text-statement mt-3">
          Know what you&apos;re installing{' '}
          <span className="text-text-muted">before you run it.</span>
        </h2>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-6">
        {/* ── Trust Score breakdown ─────────────────────────────────────── */}
        <Tile
          className="lg:col-span-4"
          title="One honest number"
          detail="Four equally weighted parts, 25 points each. Deterministic, open source and covered by tests — read it, run it, disagree with it."
        >
          <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {PARTS.map((part) => (
              <div key={part.name}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <part.icon className="text-text-muted size-4" aria-hidden />
                    {part.name}
                  </span>
                  <span className="text-text-muted font-mono text-xs tabular-nums">up to 25</span>
                </div>
                {/* Each part is a quarter of the total: the bar is that quarter. */}
                <div className="bg-surface-hover mt-2.5 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
                  {[0, 1, 2, 3].map((segment) => (
                    <span
                      key={segment}
                      className={cn(
                        'flex-1',
                        segment === PARTS.indexOf(part) ? 'bg-accent' : 'bg-transparent',
                      )}
                    />
                  ))}
                </div>
                <p className="text-text-muted mt-2 text-xs">{part.detail}</p>
              </div>
            ))}
          </div>
          <Link
            href="/trust-score"
            className="text-foreground group mt-7 inline-flex w-fit items-center gap-1.5 text-sm font-medium"
          >
            How the score works
            <ArrowRight
              className="size-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </Tile>

        {/* ── Security scan ─────────────────────────────────────────────── */}
        <Tile
          className="lg:col-span-2"
          title="Scanned, not trusted blindly"
          detail={`${pct(insights?.scanned ?? 0)} of the index has been through our security scan.`}
        >
          <ul className="space-y-2.5 text-sm">
            {SCAN_CHECKS.map((check) => (
              <li key={check} className="flex items-center gap-2.5">
                <span className="bg-accent/10 text-accent flex size-5 shrink-0 items-center justify-center rounded-full">
                  <Check className="size-3" strokeWidth={3} aria-hidden />
                </span>
                <span className="text-text-secondary">{check}</span>
              </li>
            ))}
          </ul>
        </Tile>

        {/* ── Live distribution ─────────────────────────────────────────── */}
        <Tile
          className="lg:col-span-2"
          title="The whole ecosystem, scored"
          detail={
            total > 0
              ? `${total.toLocaleString()} servers, averaging ${insights?.averageScore ?? 0} out of 100.`
              : 'Every indexed server, by Trust Score.'
          }
        >
          {insights && (
            <figure>
              <div aria-hidden className="flex h-32 items-end gap-1">
                {insights.distribution.map((count, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex-1 rounded-t-[3px]',
                      index * 10 >= TRUST_BANDS.high ? 'bg-accent' : 'bg-foreground/15',
                    )}
                    style={{ height: `${Math.max((count / peak) * 100, count > 0 ? 3 : 0)}%` }}
                  />
                ))}
              </div>
              <figcaption className="text-text-muted mt-2 flex justify-between text-xs tabular-nums">
                <span>0</span>
                <span className="text-accent font-medium">
                  {insights.trusted.toLocaleString()} Trusted
                </span>
                <span>100</span>
              </figcaption>
              <div className="sr-only">
                <table>
                  <caption>Number of servers in each 10-point Trust Score band</caption>
                  <tbody>
                    {insights.distribution.map((count, index) => (
                      <tr key={index}>
                        <th scope="row">
                          {index * 10}–{index === 9 ? 100 : index * 10 + 9}
                        </th>
                        <td>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </figure>
          )}
        </Tile>

        {/* ── Install ───────────────────────────────────────────────────── */}
        <Tile
          className="lg:col-span-4"
          title="Pick your client. Copy. Done."
          detail="Every server page gives you the exact config for the client you use — no README digging, no guessing at JSON."
        >
          <InstallTerminal />
        </Tile>

        {/* ── Badges ────────────────────────────────────────────────────── */}
        <Tile
          className="lg:col-span-3"
          title="Badges you earn, not buy"
          detail="Awarded from public rules and rechecked daily. They turn grey the day a server stops deserving them."
        >
          <div className="flex items-end justify-center gap-1 pt-2 sm:gap-3">
            {(['security-clean', 'trusted', 'top-rated', 'popular'] as const).map(
              (award, index) => (
                <Medal
                  key={award}
                  award={award}
                  tier={award === 'popular' ? 'gold' : null}
                  size={index === 1 ? 92 : 76}
                />
              ),
            )}
          </div>
        </Tile>

        {/* ── Freshness ─────────────────────────────────────────────────── */}
        <Tile
          className="lg:col-span-3"
          title="Rechecked every single day"
          detail="Scores, scans and badges move with the code. A server that goes quiet loses points — no stale five-star listings."
        >
          <dl className="grid grid-cols-2 divide-x border-t pt-5">
            <div className="pr-4">
              <dd className="text-3xl font-semibold tabular-nums tracking-tight">
                {pct(insights?.activeThisMonth ?? 0)}
              </dd>
              <dt className="text-text-muted mt-1 text-sm">committed to in the last 30 days</dt>
            </div>
            <div className="pl-6">
              <dd className="text-3xl font-semibold tabular-nums tracking-tight">
                {(insights?.trusted ?? 0).toLocaleString()}
              </dd>
              <dt className="text-text-muted mt-1 text-sm">pass all four Trusted checks</dt>
            </div>
          </dl>
        </Tile>
      </div>
    </section>
  );
}
