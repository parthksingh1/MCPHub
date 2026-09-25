import { AWARD_IDS, AWARDS, type AwardId, type AwardTier } from '@mcphub/scoring';
import Link from 'next/link';

import { medalDataUri } from '@/lib/medal';
import { cn } from '@/lib/utils';

/** Props for {@link Medal}. */
export interface MedalProps {
  award: AwardId;
  tier?: AwardTier | null;
  locked?: boolean;
  size?: number;
  className?: string;
}

/**
 * One badge medal.
 *
 * Rendered as an image from a data URI: no request, no layout shift, and the
 * exact artwork maintainers embed in their READMEs.
 */
export function Medal({
  award,
  tier,
  locked,
  size = 96,
  className,
}: MedalProps): React.JSX.Element {
  const label = AWARDS[award].label;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={medalDataUri(award, { tier, locked, size })}
      alt={`${label}${tier ? ` (${tier})` : ''}${locked ? ' — not yet earned' : ''}`}
      width={size}
      height={Math.round((size * 136) / 120)}
      className={cn(
        'select-none drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)] transition-transform duration-300',
        !locked && 'hover:-translate-y-1 hover:rotate-[-3deg]',
        className,
      )}
      draggable={false}
    />
  );
}

/** Props for {@link Achievements}. */
export interface AchievementsProps {
  earned: AwardId[];
  popularTier: AwardTier | null;
  className?: string;
}

/**
 * A server's badge case: every badge, earned ones in full colour and the rest
 * locked, with the rule to earn each one a hover away.
 *
 * Showing the locked ones is deliberate. It turns the badges into goals a
 * maintainer can work towards, rather than a label they either have or don't.
 */
export function Achievements({
  earned,
  popularTier,
  className,
}: AchievementsProps): React.JSX.Element {
  const order = [...AWARD_IDS].sort(
    (a, b) => Number(earned.includes(b)) - Number(earned.includes(a)),
  );

  return (
    <section aria-labelledby="achievements" className={cn('rounded-2xl border p-5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="achievements" className="font-semibold tracking-tight">
          Achievements
        </h2>
        <span className="text-text-muted text-xs tabular-nums">
          {earned.length} of {AWARD_IDS.length} earned
        </span>
      </div>

      <div aria-hidden className="bg-surface-hover mt-3 h-1.5 overflow-hidden rounded-full">
        <div
          className="bg-brand h-full rounded-full"
          style={{ width: `${(earned.length / AWARD_IDS.length) * 100}%` }}
        />
      </div>

      <ul className="mt-5 grid grid-cols-4 gap-x-2 gap-y-4">
        {order.map((id) => {
          const got = earned.includes(id);
          return (
            <li
              key={id}
              className="flex flex-col items-center text-center"
              title={AWARDS[id].criteria}
            >
              <Medal
                award={id}
                tier={id === 'popular' ? popularTier : null}
                locked={!got}
                size={60}
                className={got ? '' : 'opacity-70'}
              />
              <span
                className={cn(
                  'mt-1.5 text-[11px] font-medium leading-tight',
                  got ? 'text-foreground' : 'text-text-muted',
                )}
              >
                {AWARDS[id].label.replace('MCPHub ', '')}
              </span>
            </li>
          );
        })}
      </ul>

      <Link
        href="/badges#awards"
        className="text-text-muted hover:text-foreground mt-5 block text-center text-xs transition-colors"
      >
        How to earn each badge →
      </Link>
    </section>
  );
}
