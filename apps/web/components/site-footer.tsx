import { Github } from 'lucide-react';
import Link from 'next/link';

import { Logo } from '@/components/logo';
import { REPO_URL } from '@/lib/site';

/** One footer link. */
interface FooterLink {
  href: string;
  label: string;
  external?: boolean;
}

/** The three short columns: the paths people actually take, and the legal ones. */
const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Product',
    links: [
      { href: '/servers', label: 'Servers' },
      { href: '/rankings', label: 'Rankings' },
      { href: '/collections', label: 'Collections' },
      { href: '/badges', label: 'Badges' },
      { href: '/spotlight', label: 'Spotlight' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: '/trust-score', label: 'Trust Score' },
      { href: '/security', label: 'Security' },
      { href: '/docs/api', label: 'Public API' },
      { href: '/submit', label: 'Submit a server' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/legal/privacy', label: 'Privacy' },
      { href: '/legal/terms', label: 'Terms' },
      { href: '/legal/removal', label: 'Listing removal' },
      { href: '/legal/sponsored', label: 'Sponsored content' },
    ],
  },
];

/**
 * Site footer.
 *
 * Deliberately short: the main paths and the legally required links, not a
 * copy of the whole sitemap. Everything else is one click away in the header.
 */
export function SiteFooter(): React.JSX.Element {
  return (
    <footer className="mt-28 border-t">
      <div className="container pb-10 pt-14">
        <div className="grid gap-12 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" aria-label="MCPHub home">
              <Logo />
            </Link>
            <p className="text-text-muted mt-4 max-w-xs leading-relaxed">
              The trusted directory for Model Context Protocol servers. Scored, scanned and ranked
              in the open.
            </p>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="text-text-secondary hover:text-foreground mt-5 inline-flex items-center gap-2 text-sm transition-colors"
            >
              <Github className="size-4" aria-hidden />
              Source on GitHub
            </a>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-sm font-medium">{column.title}</h2>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-text-muted hover:text-foreground text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="text-text-muted mt-14 flex flex-col gap-3 border-t pt-6 text-xs leading-relaxed sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-2xl">
            Independent directory, not affiliated with Anthropic or any server listed. Names and
            logos belong to their owners; maintainers can{' '}
            <Link
              href="/legal/removal"
              className="hover:text-foreground underline underline-offset-2"
            >
              request changes or removal
            </Link>
            .
          </p>
          <p className="shrink-0">
            © {new Date().getFullYear()} MCPHub · Built by{' '}
            <a
              href="https://github.com/parthksingh1"
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-foreground underline underline-offset-2"
            >
              Parth Kumar Singh
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
