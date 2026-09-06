import * as React from 'react';

import { cn } from '@/lib/utils';

/** The single text input primitive used across MCPHub. */
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        'bg-surface flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors',
        'placeholder:text-text-muted',
        'hover:border-hover focus-visible:border-hover',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export { Input };
