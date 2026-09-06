import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { ThemeProvider } from '@/components/providers/theme-provider';

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
  keywords: ['MCP', 'Model Context Protocol', 'Claude', 'MCP servers', 'AI tools'],
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

/** Root layout: fonts, theme, and the site-wide grain overlay. */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="noise-overlay min-h-dvh font-sans">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <div className="relative z-10">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
