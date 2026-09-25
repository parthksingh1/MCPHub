import Image from 'next/image';

import { cn } from '@/lib/utils';

/** Props for {@link LogoMark} and {@link Logo}. */
interface LogoProps {
  className?: string;
}

/**
 * The MCPHub mark: the layered "M", as a rounded app-icon tile.
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
      className={cn('size-7 shrink-0 rounded-[7px]', className)}
    />
  );
}

/** The mark plus wordmark, used in the header, footer and menus. */
export function Logo({ className }: LogoProps): React.JSX.Element {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className="size-8 rounded-lg" />
      <span className="text-[17px] font-bold leading-none tracking-tight">
        MCP
        <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
          Hub
        </span>
      </span>
    </span>
  );
}
