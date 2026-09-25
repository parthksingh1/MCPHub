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
 * The "Trusted" mark shown beside a server's name.
 *
 * The one badge that appears in lists, because it answers the question a
 * visitor is actually asking. `compact` draws just the shield, for cards where
 * the name needs the room; the label is still announced and shown on hover.
 */
export function TrustedMark({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}): React.JSX.Element {
  const title = `${AWARDS.trusted.label}: ${AWARDS.trusted.summary}`;

  if (compact) {
    return (
      <span
        title={title}
        className={cn(
          'bg-accent/15 text-accent inline-flex size-5 shrink-0 items-center justify-center rounded-full',
          className,
        )}
      >
        <ShieldCheck className="size-3.5" aria-hidden />
        <span className="sr-only">MCPHub Trusted</span>
      </span>
    );
  }

  return (
    <span
      title={title}
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
