'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

/** The three theme choices, in the order they cycle. */
const THEMES = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
] as const;

/**
 * A three-way theme switch.
 *
 * Renders a fixed-size placeholder until mounted: the server has no idea what
 * the user's system preference is, so rendering the real icon immediately
 * guarantees a hydration mismatch. Reserving the space avoids the layout
 * shifting when the real control appears.
 */
export function ThemeToggle(): React.JSX.Element {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="size-8" aria-hidden />;
  }

  const index = THEMES.findIndex((option) => option.value === theme);
  const current = THEMES[index === -1 ? 2 : index] ?? THEMES[2];
  const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length] ?? THEMES[0];
  const { Icon } = current;

  return (
    <button
      type="button"
      onClick={() => setTheme(next.value)}
      aria-label={`Theme: ${current.label}. Switch to ${next.label}.`}
      title={`Theme: ${current.label}`}
      className={cn(
        'text-text-muted inline-flex size-8 items-center justify-center rounded-md',
        'hover:bg-surface-hover hover:text-foreground transition-colors duration-200',
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}
