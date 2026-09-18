'use client';

import { ChevronDown, Github, Menu, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AuthButton } from '@/components/auth-button';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { PRIMARY_NAV, SPOTLIGHT_LINK, type NavGroup } from '@/lib/nav';
import { REPO_URL } from '@/lib/site';
import { cn } from '@/lib/utils';

/** Dispatches the shortcut the command palette listens for. */
function openPalette(): void {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
}

/** True when `pathname` is inside the given link's section. */
function isActive(pathname: string, href: string): boolean {
  const base = href.split('?')[0] ?? href;
  return pathname === base || pathname.startsWith(`${base}/`);
}

/** A desktop dropdown for one navigation group. */
function NavDropdown({
  group,
  pathname,
}: {
  group: NavGroup;
  pathname: string;
}): React.JSX.Element {
  const active = group.links.some((link) => isActive(pathname, link.href));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'hover:bg-surface-hover hover:text-foreground group inline-flex h-9 cursor-pointer items-center gap-1 rounded-md px-3 text-sm outline-none transition-colors',
          'data-[state=open]:bg-surface-hover data-[state=open]:text-foreground',
          active ? 'text-foreground' : 'text-text-secondary',
        )}
      >
        {group.label}
        <ChevronDown
          className="size-3.5 opacity-60 transition-transform group-data-[state=open]:rotate-180"
          aria-hidden
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[22rem] p-1.5">
        {group.links.map((link) => {
          const Icon = link.icon;
          return (
            <DropdownMenuItem key={link.href} asChild className="items-start gap-3 p-2.5">
              <Link href={link.href}>
                {Icon && (
                  <span className="bg-background text-text-secondary mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border">
                    <Icon className="size-4" aria-hidden />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{link.label}</span>
                  {link.description && (
                    <span className="text-text-muted block text-xs leading-relaxed">
                      {link.description}
                    </span>
                  )}
                </span>
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * The site header.
 *
 * Grouped dropdowns replace the old flat row: everything reachable in two
 * clicks, nothing crowding the bar. The mobile drawer renders the same groups
 * from `lib/nav`, so the two can never drift apart.
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
        'bg-background/80 sticky top-0 z-40 w-full backdrop-blur-md transition-colors duration-200',
        scrolled ? 'border-b' : 'border-b border-transparent',
      )}
    >
      <div className="container flex h-14 items-center gap-2">
        <Link href="/" className="mr-4 flex h-9 shrink-0 items-center" aria-label="MCPHub home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main">
          <Link
            href="/servers"
            aria-current={isActive(pathname, '/servers') ? 'page' : undefined}
            className={cn(
              'hover:bg-surface-hover hover:text-foreground inline-flex h-9 items-center rounded-md px-3 text-sm font-medium transition-colors',
              isActive(pathname, '/servers') ? 'text-foreground' : 'text-text-secondary',
            )}
          >
            Servers
          </Link>
          <Link
            href="/rankings"
            aria-current={isActive(pathname, '/rankings') ? 'page' : undefined}
            className={cn(
              'hover:bg-surface-hover hover:text-foreground inline-flex h-9 items-center rounded-md px-3 text-sm transition-colors',
              isActive(pathname, '/rankings') ? 'text-foreground' : 'text-text-secondary',
            )}
          >
            Rankings
          </Link>
          {PRIMARY_NAV.map((group) => (
            <NavDropdown key={group.label} group={group} pathname={pathname} />
          ))}
          <Link
            href={SPOTLIGHT_LINK.href}
            aria-current={isActive(pathname, SPOTLIGHT_LINK.href) ? 'page' : undefined}
            className={cn(
              'hover:bg-surface-hover hover:text-foreground inline-flex h-9 items-center rounded-md px-3 text-sm transition-colors',
              isActive(pathname, SPOTLIGHT_LINK.href) ? 'text-foreground' : 'text-text-secondary',
            )}
          >
            {SPOTLIGHT_LINK.label}
          </Link>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={openPalette}
            aria-label="Search servers"
            className="bg-surface text-text-muted hover:border-hover hover:text-foreground hidden h-9 w-56 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm transition-colors lg:flex"
          >
            <Search className="size-3.5" aria-hidden />
            <span className="flex-1 text-left">Search servers…</span>
            <kbd className="bg-background rounded border px-1.5 font-mono text-[10px]">⌘K</kbd>
          </button>

          <button
            type="button"
            onClick={openPalette}
            aria-label="Search servers"
            className="text-text-secondary hover:bg-surface-hover hover:text-foreground inline-flex size-9 cursor-pointer items-center justify-center rounded-md transition-colors lg:hidden"
          >
            <Search className="size-4" />
          </button>

          <ThemeToggle />

          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="MCPHub on GitHub"
            className="text-text-secondary hover:bg-surface-hover hover:text-foreground hidden size-9 items-center justify-center rounded-md transition-colors sm:inline-flex"
          >
            <Github className="size-4" />
          </a>

          <Separator orientation="vertical" className="mx-1 hidden h-5 sm:block" />

          <Button asChild size="sm" variant="secondary" className="hidden sm:inline-flex">
            <Link href="/submit">
              <Plus aria-hidden />
              Submit
            </Link>
          </Button>

          <AuthButton className="hidden sm:inline-flex" />

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              aria-label="Open menu"
              className="text-text-secondary hover:bg-surface-hover hover:text-foreground inline-flex size-9 cursor-pointer items-center justify-center rounded-md transition-colors md:hidden"
            >
              <Menu className="size-4" />
            </SheetTrigger>
            <SheetContent side="right" className="gap-0 overflow-y-auto p-0">
              <div className="border-b p-5">
                <SheetTitle>
                  <Logo />
                </SheetTitle>
              </div>
              <nav aria-label="Mobile" className="flex flex-col gap-6 p-5">
                {[...PRIMARY_NAV, { label: 'More', links: [SPOTLIGHT_LINK] }].map((group) => (
                  <div key={group.label}>
                    <p className="eyebrow mb-2">{group.label}</p>
                    <ul className="space-y-0.5">
                      {group.links.map((link) => {
                        const Icon = link.icon;
                        return (
                          <li key={link.href}>
                            <Link
                              href={link.href}
                              className={cn(
                                'hover:bg-surface-hover flex min-h-11 items-center gap-3 rounded-md px-2 text-sm transition-colors',
                                isActive(pathname, link.href) && 'bg-surface-hover font-medium',
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
                ))}
                <div className="space-y-2 border-t pt-5">
                  <Button asChild variant="secondary" className="w-full">
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
