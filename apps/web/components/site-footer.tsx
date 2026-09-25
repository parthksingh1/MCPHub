import { CATEGORIES, CATEGORY_LABELS } from '@mcphub/shared';
import { Github } from 'lucide-react';
import Link from 'next/link';

import { Logo } from '@/components/logo';
import { EXPLORE_NAV, LEGAL_NAV, RESOURCE_NAV, SPOTLIGHT_LINK } from '@/lib/nav';
import { CONTRIBUTING_URL, REPO_URL } from '@/lib/site';

/** A titled column of footer links. */
function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string; external?: boolean }[];
}): React.JSX.Element {
  return (
    <div>
      <h2 className="text-sm font-medium">{title}</h2>
      <ul className="mt-3 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            {link.external ? (
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
  );
}

/**
 * Site footer.
 *
 * Carries the full information architecture — every page, including the legal
 * ones — plus the notices a directory of other people's work needs: no
 * affiliation with the projects listed, and marks belong to their owners.
 */
export function SiteFooter(): React.JSX.Element {
  return (
    <footer className="mt-24 border-t">
      <div className="container py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" aria-label="MCPHub home">
              <Logo />
            </Link>
            <p className="text-text-muted mt-4 max-w-xs text-sm leading-relaxed">
              The trusted directory for Model Context Protocol servers. Scored, scanned, and ranked
              in the open.
            </p>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="text-text-muted hover:text-foreground mt-5 inline-flex items-center gap-2 text-sm transition-colors"
            >
              <Github className="size-4" aria-hidden />
              Star on GitHub
            </a>
          </div>

          <FooterColumn title="Explore" links={EXPLORE_NAV} />
          <FooterColumn
            title="Resources"
            links={[...RESOURCE_NAV, { href: '/submit', label: 'Submit a server' }]}
          />
          <FooterColumn
            title="Project"
            links={[
              SPOTLIGHT_LINK,
              { href: REPO_URL, label: 'Source code', external: true },
              { href: CONTRIBUTING_URL, label: 'Contributing', external: true },
              { href: `${REPO_URL}/issues/new`, label: 'Report a bug', external: true },
            ]}
          />
          <FooterColumn title="Legal" links={LEGAL_NAV} />
        </div>

        <nav className="mt-12 border-t pt-8" aria-label="Browse by category">
          <p className="eyebrow mb-3">Categories</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
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

        <div className="text-text-muted mt-8 space-y-3 border-t pt-8 text-xs leading-relaxed">
          <p>
            MCPHub is an independent directory. It is not affiliated with Anthropic, the Model
            Context Protocol project, or any server listed here. Product names, logos, and marks
            belong to their respective owners. Listings are built from public GitHub and package
            registry data; maintainers can{' '}
            <Link
              href="/legal/removal"
              className="hover:text-foreground underline underline-offset-2"
            >
              request changes or removal
            </Link>
            .
          </p>
          <p className="flex flex-wrap items-center justify-between gap-2">
            <span>© {new Date().getFullYear()} MCPHub · MIT licensed</span>
            <span>
              Built by{' '}
              <a
                href="https://github.com/parthksingh1"
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-foreground underline underline-offset-2"
              >
                Parth Kumar Singh
              </a>
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
