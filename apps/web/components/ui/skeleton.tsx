import { cn } from '@/lib/utils';

/**
 * A loading placeholder.
 *
 * Skeletons rather than spinners throughout: a skeleton preserves the layout,
 * so the page does not jump when content arrives, and it communicates *what*
 * is loading rather than merely that something is.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      className={cn(
        'bg-surface-hover relative overflow-hidden rounded-md',
        'after:animate-shimmer after:absolute after:inset-0 after:-translate-x-full',
        'after:bg-gradient-to-r after:from-transparent after:via-white/5 after:to-transparent',
        className,
      )}
      aria-hidden
      {...props}
    />
  );
}
