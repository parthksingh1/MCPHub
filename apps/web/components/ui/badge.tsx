import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * shadcn/ui Badge. Status variants carry colour, but every use pairs it with a
 * text label or icon so meaning never rests on colour alone.
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-4 [&_svg]:size-3 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-surface-hover text-text-secondary border-transparent',
        outline: 'text-text-secondary',
        solid: 'bg-foreground text-background border-transparent',
        accent: 'border-accent/30 bg-accent/10 text-accent',
        success: 'border-success/30 bg-success/10 text-success',
        warn: 'border-warn/30 bg-warn/10 text-warn',
        danger: 'border-danger/30 bg-danger/10 text-danger',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

/** Props for {@link Badge}. */
export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

/** A small status or category chip. */
export function Badge({ className, variant, ...props }: BadgeProps): React.JSX.Element {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
