'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ComponentProps } from 'react';

/**
 * Wraps next-themes so the `dark` class is applied before paint,
 * avoiding a flash of the wrong theme.
 */
export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>): React.JSX.Element {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
