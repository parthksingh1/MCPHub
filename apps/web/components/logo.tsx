import { cn } from '@/lib/utils';

/** Props for {@link LogoMark} and {@link Logo}. */
export interface LogoProps {
  className?: string;
}

/**
 * The MCPHub mark: three client nodes wired to a single green core.
 *
 * It says what the product is — the Model Context Protocol connects models to
 * tools through one hub — and the core is the only coloured element, which is
 * the same rule the rest of the UI follows: colour means "verified", never
 * decoration. Drawn on a 32-unit grid so it stays crisp at 16px.
 */
export function LogoMark({ className }: LogoProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden className={cn('size-6 shrink-0', className)}>
      <rect width="32" height="32" rx="8" className="fill-foreground" />
      <g className="stroke-background" strokeWidth="2" strokeLinecap="round">
        <path d="M16 16.5V8.5M16 16.5 9.2 21.5M16 16.5l6.8 5" />
      </g>
      <g className="fill-background">
        <circle cx="16" cy="7.5" r="2.6" />
        <circle cx="8.4" cy="22.2" r="2.6" />
        <circle cx="23.6" cy="22.2" r="2.6" />
      </g>
      <circle cx="16" cy="16.5" r="3.6" className="fill-accent" />
    </svg>
  );
}

/** The mark plus wordmark, used in the header and footer. */
export function Logo({ className }: LogoProps): React.JSX.Element {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark className="size-7" />
      <span className="text-base font-semibold leading-none tracking-tight">
        MCP<span className="text-text-muted">Hub</span>
      </span>
    </span>
  );
}
