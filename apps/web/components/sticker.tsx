import { STICKERS, type StickerTier } from '@mcphub/scoring';

import { stickerDataUri } from '@/lib/sticker';
import { cn } from '@/lib/utils';

/** Props for {@link Sticker}. */
export interface StickerProps {
  tier: StickerTier;
  /** The real score to print; defaults to the tier's threshold. */
  score?: number;
  size?: number;
  className?: string;
}

/**
 * A score sticker that peels when you hover or focus it.
 *
 * The artwork is a data-URI SVG; the peel is pure CSS (`.sticker-peel` in
 * globals.css), so it costs no JavaScript and respects reduced motion.
 */
export function Sticker({ tier, score, size = 140, className }: StickerProps): React.JSX.Element {
  const label = `${STICKERS[tier].label} score sticker${score !== undefined ? ` — ${score}` : ''}`;
  return (
    <span
      tabIndex={0}
      className={cn('sticker-peel', tier === 'perfect' && 'sticker-holo', className)}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={stickerDataUri(tier, { score, size })}
        alt={label}
        width={size}
        height={size}
        draggable={false}
      />
    </span>
  );
}
