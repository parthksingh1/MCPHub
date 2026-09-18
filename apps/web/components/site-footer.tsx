import { CATEGORIES, CATEGORY_LABELS } from '@mcphub/shared';
import Link from 'next/link';

import { Logo } from '@/components/logo';
import { CONTRIBUTING_URL, REPO_URL } from '@/lib/site';

/** Footer link groups, kept declarative so the layout stays symmetrical. */
const SECTIONS = [
  {
    title: 'Directory',
    links: [
      { label: 'Browse servers', href: '/servers' },
      { label: 'Categories', href: '/categories' },
      { label: 'Compare servers', href: '/compare' },
      { label: 'Submit a server', href: '/submit' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { label: 'How the Trust Score works', href: '/trust-score' },
      { label: 'Blog', href: '/blog' },
      { label: 'API documentation', href: '/docs/api' },
      { label: 'Security policy', href: '/security' },
    ],
  },
  {
    title: 'Project',
    links: [
      { label: 'GitHub', href: REPO_URL, external: true },
      { label: 'Contributing', href: CONTRIBUTING_URL, external: true },
      { label: 'Model Context Protocol', href: 'https://modelcontextprotocol.io', external: true },
    ],
  },
];

/** Site-wide footer with the full information architecture. */
export function SiteFooter(): React.JSX.Element {
  return (
    <footer className="mt-24 border-t">
      <div className="container py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <Logo />
            </Link>
            <p className="text-text-muted mt-3 max-w-xs text-sm leading-relaxed">
              The trusted directory for Model Context Protocol servers. Every server is scored,
              scanned, and vetted.
            </p>
          </div>

          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="text-sm font-medium">{section.title}</h2>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    {'external' in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-text-muted hover:text-foreground text-sm transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-text-muted hover:text-foreground text-sm transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Category links are in the footer for crawlers as much as for people:
            they give every category page an internal link from every page. */}
        <nav className="mt-10 border-t pt-6" aria-label="Browse by category">
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {CATEGORIES.map((slug) => (
              <li key={slug}>
                <Link
                  href={`/categories/${slug}`}
                  className="text-text-muted hover:text-foreground text-xs transition-colors"
                >
                  {CATEGORY_LABELS[slug]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="text-text-muted mt-8 flex flex-col gap-2 border-t pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} MCPHub · MIT licensed · built by{' '}
            <a
              href="https://github.com/parthksingh1"
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-foreground underline underline-offset-2 transition-colors"
            >
              Parth Kumar Singh
            </a>
          </p>
          <p>
            Not affiliated with Anthropic. MCP is an open protocol by{' '}
            <a
              href="https://modelcontextprotocol.io"
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-foreground underline underline-offset-2 transition-colors"
            >
              modelcontextprotocol.io
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
