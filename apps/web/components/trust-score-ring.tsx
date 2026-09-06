'use client';

import { getTrustBand, getTrustLabel } from '@mcphub/scoring';
import { TRUST_MAX_TOTAL } from '@mcphub/shared';
import { motion, useReducedMotion } from 'framer-motion';

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
  /** Show the band label beneath the number. */
  showLabel?: boolean;
  className?: string;
}

/** Tailwind text colour per band, used for both ring and numeral. */
const BAND_CLASS = {
  high: 'text-success',
  medium: 'text-warn',
  low: 'text-danger',
} as const;

/**
 * The Trust Score ring — MCPHub's signature visual.
 *
 * Colour alone never carries the meaning: the number is always present when
 * the ring is large enough to hold it, and the accessible label spells out
 * both the score and the band. That keeps it readable for colour-blind users
 * and in screen readers, where a green arc communicates nothing.
 */
export function TrustScoreRing({
  score,
  size = 56,
  strokeWidth = 4,
  showValue = true,
  showLabel = false,
  className,
}: TrustScoreRingProps): React.JSX.Element {
  const reduceMotion = useReducedMotion();

  const clamped = Math.max(0, Math.min(TRUST_MAX_TOTAL, score));
  const band = getTrustBand(clamped);
  const label = getTrustLabel(clamped);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (clamped / TRUST_MAX_TOTAL) * circumference;

  return (
    <div
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Trust Score ${clamped} out of ${TRUST_MAX_TOTAL} — ${label}`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden focusable="false">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="text-text-muted/20 stroke-current"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          className={cn('stroke-current', BAND_CLASS[band])}
          initial={{ strokeDashoffset: reduceMotion ? circumference - filled : circumference }}
          animate={{ strokeDashoffset: circumference - filled }}
          transition={{ duration: reduceMotion ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>

      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span
            className={cn('font-semibold tabular-nums', BAND_CLASS[band])}
            style={{ fontSize: size * 0.32 }}
          >
            {clamped}
          </span>
          {showLabel && (
            <span className="text-text-muted mt-0.5 text-[10px] font-medium">{label}</span>
          )}
        </div>
      )}
    </div>
  );
}
