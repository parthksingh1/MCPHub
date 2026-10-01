import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { Medal } from '@/components/medal';
import { Sticker } from '@/components/sticker';

/** The medals on show, in a slightly fanned row. */
const FAN = [
  { award: 'security-clean', rotate: -8, lift: 10 },
  { award: 'trusted', rotate: 0, lift: -6 },
  { award: 'top-rated', rotate: 7, lift: 8 },
  { award: 'popular', rotate: 12, lift: 22 },
] as const;

/**
 * Badges and stickers, shown off on the homepage.
 *
 * Gives maintainers a reason to care before they ever visit /badges: these
 * are earned automatically, they look good in a README, and the sticker
 * peels when you hover it.
 */
export function BadgeShowcase(): React.JSX.Element {
  return (
    <section className="container py-16" aria-labelledby="showcase-heading">
      <div className="bg-surface relative overflow-hidden rounded-3xl border px-8 py-12 sm:px-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(520px 300px at 85% 30%, rgba(234,179,8,0.10), transparent 70%)',
          }}
        />
        <div className="relative grid items-center gap-12 lg:grid-cols-[1fr_1.15fr]">
          <div>
            <p className="eyebrow">For maintainers</p>
            <h2 id="showcase-heading" className="text-section-title mt-2 font-semibold">
              Badges you earn, not buy
            </h2>
            <p className="text-text-muted mt-3 max-w-md leading-relaxed">
              Eight medals and five score stickers, awarded automatically from public rules and
              rechecked every day. Put them in your README — they turn grey if you lose them.
            </p>
            <Link
              href="/badges"
              className="text-foreground group mt-6 inline-flex items-center gap-1.5 font-medium"
            >
              See every badge
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 sm:flex-nowrap sm:justify-end">
            <div className="flex items-end -space-x-3">
              {FAN.map((item) => (
                <div
                  key={item.award}
                  style={{ transform: `translateY(${item.lift}px) rotate(${item.rotate}deg)` }}
                >
                  <Medal
                    award={item.award}
                    tier={item.award === 'popular' ? 'gold' : null}
                    size={92}
                  />
                </div>
              ))}
            </div>
            <Sticker tier="perfect" size={150} className="shrink-0 rotate-[-6deg]" />
          </div>
        </div>
      </div>
    </section>
  );
}
