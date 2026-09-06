'use client';

import { getTrustBand, getTrustLabel } from '@mcphub/scoring';
import { TRUST_MAX_TOTAL } from '@mcphub/shared';
import { motion, useReducedMotion } from 'framer-motion';
import { useId } from 'react';

import { cn } from '@/lib/utils';

/** Props for {@link TrustScoreRing}. */
export interface TrustScoreRingProps {
  /** The 0-100 total. */
  score: number;
  /** Diameter in pixels. */
  size?: number;
  /** Ring thickness in pixels. */
  strokeWidth?: number;
  /** Show the numeric score in the middle. */
  showValue?: boolean;
  /** Show the band label beneath the ring. */
  showLabel?: boolean;
  /** Adds an outer bloom. Reserved for the hero and detail page. */
  glow?: boolean;
  className?: string;
}

/** Tailwind text colour per band, used for ring, numeral, and glow. */
const BAND_CLASS = {
  high: 'text-success',
  medium: 'text-warn',
  low: 'text-danger',
} as const;

/** Gradient stop pairs per band, so the arc has depth rather than one flat hue. */
const BAND_STOPS = {
  high: ['hsl(152 68% 46%)', 'hsl(168 72% 52%)'],
  medium: ['hsl(38 95% 55%)', 'hsl(26 95% 60%)'],
  low: ['hsl(350 90% 60%)', 'hsl(330 85% 62%)'],
} as const;

/**
 * The Trust Score ring — MCPHub's signature element.
 *
 * The arc is a gradient rather than a flat stroke, and the track is drawn
 * thinner than the arc: at small sizes an equal-width track reads as a muddy
 * circle rather than a gauge.
 *
 * Colour alone never carries meaning. The number is always present when the
 * ring is large enough to hold it, and the accessible label spells out the
 * score and the band — a green arc communicates nothing to a screen reader, or
 * to the ~8% of men with a colour vision deficiency.
 */
export function TrustScoreRing({
  score,
  size = 56,
  strokeWidth = 4,
  showValue = true,
  showLabel = false,
  glow = false,
  className,
}: TrustScoreRingProps): React.JSX.Element {
  const reduceMotion = useReducedMotion();
  const gradientId = useId();

  const clamped = Math.max(0, Math.min(TRUST_MAX_TOTAL, score));
  const band = getTrustBand(clamped);
  const label = getTrustLabel(clamped);
  const [from, to] = BAND_STOPS[band];

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (clamped / TRUST_MAX_TOTAL) * circumference;

  return (
    <div className={cn('inline-flex flex-col items-center gap-1.5', className)}>
      <div
        className={cn(
          'relative inline-flex shrink-0 items-center justify-center',
          BAND_CLASS[band],
        )}
        style={{ width: size, height: size }}
        role="img"
        aria-label={`Trust Score ${clamped} out of ${TRUST_MAX_TOTAL} — ${label}`}
      >
        {glow && (
          <span
            aria-hidden
            className="absolute inset-0 rounded-full opacity-30 blur-xl"
            style={{ background: `radial-gradient(circle, ${from}, transparent 68%)` }}
          />
        )}

        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="relative -rotate-90"
          aria-hidden
          focusable="false"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={from} />
              <stop offset="100%" stopColor={to} />
            </linearGradient>
          </defs>

          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth * 0.75}
            className="stroke-current opacity-[0.14]"
          />

          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: reduceMotion ? circumference - filled : circumference }}
            animate={{ strokeDashoffset: circumference - filled }}
            transition={{ duration: reduceMotion ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>

        {showValue && (
          <span
            className="absolute inset-0 flex items-center justify-center font-semibold tabular-nums leading-none"
            style={{ fontSize: size * 0.33, letterSpacing: '-0.03em' }}
          >
            {clamped}
          </span>
        )}
      </div>

      {/*
        The band label sits beneath the ring rather than inside it. "Use with
        caution" is far wider than any circle small enough to belong on a card,
        so nesting it guarantees an overflow at every size that matters.
      */}
      {showLabel && (
        <span className={cn('text-[11px] font-medium tracking-wide', BAND_CLASS[band])}>
          {label}
        </span>
      )}
    </div>
  );
}
