import { getTrustBand, getTrustLabel } from '@mcphub/scoring';

import { cn } from '@/lib/utils';

/** Band dot colours — the only colour on a card, because it carries meaning. */
const DOT = {
  high: 'bg-emerald-500',
  medium: 'bg-amber-500',
  low: 'bg-red-500',
} as const;

/**
 * A compact Trust Score: a status dot and the number.
 *
 * Used wherever a score sits beside other content (cards, lists). The large
 * ring is kept for the detail page, where the score is the subject. The label
 * is spelled out for screen readers and on hover, so colour is never the only
 * cue.
 */
export function TrustPill({
  score,
  className,
}: {
  score: number;
  className?: string;
}): React.JSX.Element {
  const band = getTrustBand(score);
  const label = getTrustLabel(score);

  return (
    <span
      title={`Trust Score ${score}/100 — ${label}`}
      className={cn(
        'bg-background inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 font-mono text-xs font-medium tabular-nums',
        className,
      )}
    >
      <span aria-hidden className={cn('size-1.5 rounded-full', DOT[band])} />
      {score}
      <span className="sr-only">out of 100, {label}</span>
    </span>
  );
}
