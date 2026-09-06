'use client';

import { Github, Menu, Search, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AuthButton } from '@/components/auth-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { REPO_URL } from '@/lib/site';
import { cn } from '@/lib/utils';

/** Primary navigation. */
const NAV = [
  { href: '/servers', label: 'Browse' },
  { href: '/categories', label: 'Categories' },
  { href: '/trust-score', label: 'Trust Score' },
  { href: '/blog', label: 'Blog' },
] as const;

/** Props for {@link SiteHeader}. */
export interface SiteHeaderProps {
  /** Opens the command palette. */
  onSearchClick?: () => void;
}

/**
 * The site header.
 *
 * Sticky and translucent, with the border only appearing once the page has
 * scrolled — at rest it should feel like part of the hero rather than a bar
 * bolted on top of it.
 */
export function SiteHeader(): React.JSX.Element {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 8);
    onScroll();

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu on navigation; leaving it open over the new page is
  // disorienting.
  useEffect(() => setMenuOpen(false), [pathname]);

  /** Dispatches the same shortcut the palette listens for. */
  const openPalette = (): void => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }),
    );
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-all duration-200',
        'bg-background/80 backdrop-blur-md',
        scrolled ? 'border-b' : 'border-b border-transparent',
      )}
    >
      <div className="container flex h-14 items-center gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
          <span
            className="from-accent-from to-accent-to inline-block size-5 rounded bg-gradient-to-br"
            aria-hidden
          />
          MCPHub
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm transition-colors duration-200',
                  active
                    ? 'text-foreground'
                    : 'text-text-muted hover:bg-surface-hover hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={openPalette}
            aria-label="Search servers"
            className={cn(
              'bg-surface group hidden items-center gap-2 rounded-md border px-3 py-1.5 text-sm',
              'text-text-muted hover:border-hover hover:bg-surface-hover transition-colors duration-200 sm:flex',
            )}
          >
            <Search className="size-3.5" aria-hidden />
            <span className="pr-6">Search…</span>
            <kbd className="rounded border px-1.5 font-mono text-[10px]">⌘K</kbd>
          </button>

          <button
            type="button"
            onClick={openPalette}
            aria-label="Search servers"
            className="text-text-muted hover:bg-surface-hover hover:text-foreground inline-flex size-8 items-center justify-center rounded-md transition-colors sm:hidden"
          >
            <Search className="size-4" />
          </button>

          <ThemeToggle />

          <AuthButton className="hidden sm:block" />

          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="MCPHub on GitHub"
            className="text-text-muted hover:bg-surface-hover hover:text-foreground inline-flex size-8 items-center justify-center rounded-md transition-colors"
          >
            <Github className="size-4" />
          </a>

          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="text-text-muted hover:bg-surface-hover hover:text-foreground inline-flex size-8 items-center justify-center rounded-md transition-colors md:hidden"
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t md:hidden" aria-label="Mobile">
          <div className="container flex flex-col py-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-text-secondary hover:bg-surface-hover hover:text-foreground rounded-md px-2 py-2.5 text-sm transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/submit"
              className="text-accent mt-1 rounded-md px-2 py-2.5 text-sm font-medium"
            >
              Submit a server
            </Link>

            {/* The header control is hidden below `sm`, so without this there
                is no way to sign in on a phone at all. */}
            <div className="mt-3 border-t pt-3">
              <AuthButton variant="full" />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
