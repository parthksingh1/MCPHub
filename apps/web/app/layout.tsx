import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Suspense } from 'react';

import { AuthNotice } from '@/components/auth-notice';
import { CommandPalette } from '@/components/command-palette';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

import './globals.css';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'MCPHub — The trusted directory for MCP servers',
    template: '%s · MCPHub',
  },
  description:
    'Discover, compare, and safely install Model Context Protocol servers. Every server is scored, scanned, and vetted.',
  keywords: ['MCP', 'Model Context Protocol', 'Claude', 'MCP servers', 'AI tools', 'Cursor'],
  openGraph: {
    type: 'website',
    siteName: 'MCPHub',
    url: siteUrl,
    title: 'MCPHub — The trusted directory for MCP servers',
    description:
      'Discover, compare, and safely install Model Context Protocol servers. Every server is scored, scanned, and vetted.',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fcfcfd' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0b' },
  ],
};

/** Root layout: fonts, theme, chrome, and the global command palette. */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="atmosphere min-h-dvh font-sans">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {/* Keyboard users should be able to reach the content without
              tabbing through the whole header on every page. */}
          <a
            href="#main"
            className="focus:bg-surface sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:border focus:px-4 focus:py-2 focus:text-sm"
          >
            Skip to content
          </a>

          {/* The ambient colour wash sits above the grid, below the content. */}
          <div className="aurora" aria-hidden />

          <div className="relative z-10 flex min-h-dvh flex-col">
            <SiteHeader />
            <div id="main" className="flex-1">
              {children}
            </div>
            <SiteFooter />
          </div>

          <CommandPalette />

          {/* Reads a search param, so it must sit inside a Suspense boundary
              or every page opts out of static rendering. */}
          <Suspense fallback={null}>
            <AuthNotice />
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
