import { TRUST_BANDS } from '@mcphub/shared';

import type { IndexInsights as Insights } from '@/lib/queries/servers';
import { cn } from '@/lib/utils';

/** Bar colour for a 10-point bucket, by the trust band it mostly falls in. */
function bucketTone(start: number): string {
  if (start >= TRUST_BANDS.high + 5) return 'bg-emerald-500/80 dark:bg-emerald-400/80';
  if (start >= TRUST_BANDS.medium) return 'bg-amber-500/80 dark:bg-amber-400/80';
  return 'bg-rose-500/70 dark:bg-rose-400/70';
}

const LEGEND = [
  { label: 'Trusted (75+)', tone: 'bg-emerald-500 dark:bg-emerald-400' },
  { label: 'Reasonable (50–74)', tone: 'bg-amber-500 dark:bg-amber-400' },
  { label: 'Review before use', tone: 'bg-rose-500 dark:bg-rose-400' },
];

/**
 * "The index at a glance": four live numbers and the shape of every score.
 *
 * The distribution chart answers a question no list can: how good is the
 * ecosystem as a whole? Colour follows the trust bands and is always paired
 * with a legend and a screen-reader table, never colour alone.
 */
export function IndexInsights({ insights }: { insights: Insights }): React.JSX.Element | null {
  if (insights.total === 0) return null;

  const pct = (n: number): string => `${Math.round((n / insights.total) * 100)}%`;
  const peak = Math.max(...insights.distribution, 1);

  const facts = [
    { value: String(insights.averageScore), label: 'average Trust Score', note: 'out of 100' },
    {
      value: pct(insights.scanned),
      label: 'security-scanned',
      note: `${insights.scanned.toLocaleString()} servers`,
    },
    {
      value: insights.trusted.toLocaleString(),
      label: 'MCPHub Trusted',
      note: 'all four checks, daily',
    },
    {
      value: pct(insights.activeThisMonth),
      label: 'active this month',
      note: 'committed in 30 days',
    },
  ];

  return (
    <section className="container py-16" aria-labelledby="insights-heading">
      <p className="eyebrow">Live from the index</p>
      <h2 id="insights-heading" className="text-section-title mt-2 font-semibold">
        The ecosystem at a glance
      </h2>
      <p className="text-text-muted mt-1.5 max-w-xl">
        Every number below is computed from {insights.total.toLocaleString()} servers, today.
      </p>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_1.25fr] lg:items-end">
        <dl className="grid grid-cols-2 border-l border-t">
          {facts.map((fact) => (
            <div key={fact.label} className="border-b border-r p-5 sm:p-6">
              <dd className="text-4xl font-semibold tabular-nums tracking-tight">{fact.value}</dd>
              <dt className="mt-2 font-medium">{fact.label}</dt>
              <p className="text-text-muted text-sm">{fact.note}</p>
            </div>
          ))}
        </dl>

        <figure>
          <figcaption className="flex flex-wrap items-baseline justify-between gap-3">
            <span className="font-medium">How every server scores</span>
            <span className="text-text-muted text-sm">servers per 10-point band</span>
          </figcaption>
          <div aria-hidden className="mt-5 flex h-52 items-end gap-1.5 border-b">
            {insights.distribution.map((count, index) => (
              <div key={index} className="group relative flex h-full flex-1 items-end">
                <div
                  className={cn(
                    'w-full rounded-t-md transition-opacity group-hover:opacity-100',
                    bucketTone(index * 10),
                  )}
                  style={{ height: `${Math.max((count / peak) * 100, count > 0 ? 2 : 0)}%` }}
                />
                <span className="bg-foreground text-background pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded px-1.5 py-0.5 text-xs tabular-nums group-hover:block">
                  {count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <div
            aria-hidden
            className="text-text-muted mt-2 flex justify-between text-xs tabular-nums"
          >
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {LEGEND.map((item) => (
              <li key={item.label} className="text-text-secondary inline-flex items-center gap-2">
                <span aria-hidden className={cn('size-2.5 rounded-sm', item.tone)} />
                {item.label}
              </li>
            ))}
          </ul>
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
      </div>
    </section>
  );
}
