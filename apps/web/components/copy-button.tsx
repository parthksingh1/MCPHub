'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

/** Props for {@link CopyButton}. */
export interface CopyButtonProps {
  /** The text placed on the clipboard. */
  value: string;
  /** Accessible description of what is being copied. */
  label?: string;
  className?: string;
}

/**
 * Copies text to the clipboard, with a brief confirmation.
 *
 * Copying an install command is the single action MCPHub exists to make easy,
 * so the feedback has to be unmistakable and instant. The icon swap is
 * announced through a live region as well, because a purely visual tick tells
 * a screen reader user nothing.
 */
export function CopyButton({
  value,
  label = 'Copy to clipboard',
  className,
}: CopyButtonProps): React.JSX.Element {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Clearing on unmount avoids setting state on a component the user has
  // already navigated away from.
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setFailed(false);
    } catch {
      // Clipboard access is denied outside a secure context, and in some
      // embedded browsers. Say so rather than silently doing nothing.
      setFailed(true);
    }

    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setCopied(false);
      setFailed(false);
    }, 2000);
  }, [value]);

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className={cn(
        'text-text-muted inline-flex size-8 items-center justify-center rounded-md border',
        'transition-all duration-200 ease-out',
        'hover:border-hover hover:bg-surface-hover hover:text-foreground',
        copied && 'border-success/40 text-success',
        failed && 'border-danger/40 text-danger',
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={copied ? 'copied' : 'idle'}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="flex items-center justify-center"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </motion.span>
      </AnimatePresence>

      <span role="status" aria-live="polite" className="sr-only">
        {copied ? 'Copied' : failed ? 'Copy failed — select the text and copy manually' : ''}
      </span>
    </button>
  );
}
