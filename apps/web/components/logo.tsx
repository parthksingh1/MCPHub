import Image from 'next/image';

import { cn } from '@/lib/utils';

/** Props for {@link LogoMark} and {@link Logo}. */
interface LogoProps {
  className?: string;
}

/**
 * The MCPHub mark: the layered "M", on a transparent background so it sits
 * directly on the header in both themes.
 *
 * Served from `/brand/mark.png` (a 128px export of the master logo), so it is
 * crisp on retina screens at header size and weighs a few kilobytes.
 */
export function LogoMark({ className }: LogoProps): React.JSX.Element {
  return (
    <Image
      src="/brand/mark.png"
      alt=""
      width={128}
      height={128}
      priority
      className={cn('size-7 shrink-0 object-contain', className)}
    />
  );
}

/** The mark plus wordmark, used in the header, footer and menus. */
export function Logo({ className }: LogoProps): React.JSX.Element {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className="size-9" />
      <span className="text-[17px] font-bold leading-none tracking-tight">
        MCP
        <span className="text-text-muted">Hub</span>
      </span>
    </span>
  );
}
