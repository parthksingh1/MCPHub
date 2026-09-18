import { AWARDS, type AwardId } from '@mcphub/scoring';
import {
  Activity,
  Award,
  BadgeCheck,
  Building2,
  ScanSearch,
  ShieldCheck,
  Star,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

/** One icon per badge, from the same Lucide family as the rest of the UI. */
export const AWARD_ICON: Record<AwardId, LucideIcon> = {
  trusted: ShieldCheck,
  'security-clean': ScanSearch,
  'top-rated': Award,
  verified: BadgeCheck,
  official: Building2,
  popular: Star,
  maintained: Activity,
  rising: TrendingUp,
};

/**
 * The compact "Trusted" mark shown beside a server's name in lists.
 *
 * The one badge that appears on cards, because it is the one that answers the
 * question a visitor is actually asking. It uses the brand accent — the only
 * place a list gets colour beyond the score dot.
 */
export function TrustedMark({ className }: { className?: string }): React.JSX.Element {
  return (
    <span
      title={`${AWARDS.trusted.label}: ${AWARDS.trusted.summary}`}
      className={cn(
        'border-accent/30 bg-accent/10 text-accent inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-px text-[11px] font-semibold leading-4',
        className,
      )}
    >
      <ShieldCheck className="size-3" aria-hidden />
      Trusted
    </span>
  );
}

/**
 * Every badge a server has earned, with what each one means.
 *
 * Each line explains itself in plain words and links to the published rules —
 * a badge nobody can check is just decoration.
 */
export function AwardList({
  awards,
  className,
}: {
  awards: AwardId[];
  className?: string;
}): React.JSX.Element {
  return (
    <section aria-labelledby="awards-heading" className={cn('rounded-xl border p-5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="awards-heading" className="text-sm font-semibold">
          MCPHub badges
        </h2>
        <Link
          href="/badges#awards"
          className="text-text-muted hover:text-foreground text-xs transition-colors"
        >
          How badges work
        </Link>
      </div>

      {awards.length === 0 ? (
        <p className="text-text-muted mt-3 text-sm leading-relaxed">
          No badges yet. Badges are earned automatically as the server meets each published rule.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {awards.map((id) => {
            const Icon = AWARD_ICON[id];
            const highlight = id === 'trusted';
            return (
              <li key={id} className="flex items-start gap-3">
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-lg',
                    highlight ? 'bg-accent/10 text-accent' : 'bg-surface-hover text-text-secondary',
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{AWARDS[id].label}</span>
                  <span className="text-text-muted block text-xs leading-relaxed">
                    {AWARDS[id].summary}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
