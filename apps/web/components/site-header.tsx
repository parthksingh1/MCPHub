'use client';

import { Menu, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AuthButton } from '@/components/auth-button';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  EXPLORE_NAV,
  MAIN_NAV,
  RESOURCE_NAV,
  SPOTLIGHT_LINK,
  isNavActive,
  type NavLink,
} from '@/lib/nav';
import { cn } from '@/lib/utils';

/** Dispatches the shortcut the command palette listens for. */
function openPalette(): void {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
}

/** One section of the mobile menu. */
function MobileSection({
  title,
  links,
  pathname,
}: {
  title: string;
  links: NavLink[];
  pathname: string;
}): React.JSX.Element {
  return (
    <div>
      <p className="text-text-muted mb-1.5 px-2 text-xs font-medium">{title}</p>
      <ul>
        {links.map((link) => {
          const Icon = link.icon;
          const active = isNavActive(pathname, link.href) && !link.href.includes('?');
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center gap-3 rounded-lg px-2 text-[15px] transition-colors',
                  active ? 'bg-surface-hover font-medium' : 'hover:bg-surface-hover',
                )}
              >
                {Icon && <Icon className="text-text-muted size-4" aria-hidden />}
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * The site header.
 *
 * One flat row of five destinations — no menus to open, nothing hidden behind
 * a chevron. Everything secondary lives in the footer and the mobile menu,
 * both driven by the same lists in `lib/nav`.
 */
export function SiteHeader(): React.JSX.Element {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={cn(
        'bg-background/80 sticky top-0 z-40 w-full backdrop-blur-xl transition-colors duration-200',
        scrolled ? 'border-b' : 'border-b border-transparent',
      )}
    >
      <div className="container flex h-16 items-center gap-6">
        <Link href="/" className="flex h-9 shrink-0 items-center" aria-label="MCPHub home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {MAIN_NAV.map((link) => {
            const active = isNavActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium transition-colors',
                  active
                    ? 'bg-surface-hover text-foreground'
                    : 'text-text-secondary hover:text-foreground',
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {/* Full search field on wide screens, an icon below that. */}
          <button
            type="button"
            onClick={openPalette}
            aria-label="Search servers"
            className="bg-surface text-text-muted hover:border-hover hover:text-foreground hidden h-9 w-60 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm shadow-sm transition-colors xl:flex"
          >
            <Search className="size-4" aria-hidden />
            <span className="flex-1 truncate text-left">Search servers…</span>
            <kbd className="bg-background rounded border px-1.5 font-mono text-[10px]">⌘K</kbd>
          </button>
          <button
            type="button"
            onClick={openPalette}
            aria-label="Search servers"
            className="text-text-secondary hover:bg-surface-hover hover:text-foreground inline-flex size-9 cursor-pointer items-center justify-center rounded-lg transition-colors xl:hidden"
          >
            <Search className="size-[18px]" />
          </button>

          <ThemeToggle />

          <Button asChild size="sm" className="hidden rounded-lg sm:inline-flex">
            <Link href="/submit">
              <Plus aria-hidden />
              Submit
            </Link>
          </Button>

          <AuthButton className="hidden sm:inline-flex" />

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              aria-label="Open menu"
              className="text-text-secondary hover:bg-surface-hover hover:text-foreground inline-flex size-9 cursor-pointer items-center justify-center rounded-lg transition-colors lg:hidden"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[88vw] max-w-sm gap-0 overflow-y-auto p-0">
              <div className="flex h-16 shrink-0 items-center border-b px-5">
                <SheetTitle>
                  <Logo />
                </SheetTitle>
              </div>
              <nav aria-label="Mobile" className="flex flex-col gap-6 p-3 pb-8">
                <MobileSection title="Browse" links={MAIN_NAV} pathname={pathname} />
                <MobileSection
                  title="Discover"
                  links={EXPLORE_NAV.filter(
                    (link) => link.href.includes('?') || link.href === '/compare',
                  )}
                  pathname={pathname}
                />
                <MobileSection
                  title="Resources"
                  links={[
                    ...RESOURCE_NAV.filter((link) => link.href !== '/trust-score'),
                    SPOTLIGHT_LINK,
                  ]}
                  pathname={pathname}
                />
                <div className="space-y-2 border-t px-2 pt-5">
                  <Button asChild className="w-full">
                    <Link href="/submit">
                      <Plus aria-hidden />
                      Submit a server
                    </Link>
                  </Button>
                  <AuthButton variant="full" />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
