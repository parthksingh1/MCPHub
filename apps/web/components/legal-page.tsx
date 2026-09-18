import Link from 'next/link';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { LEGAL_NAV } from '@/lib/nav';
import { cn } from '@/lib/utils';

/** One titled section of a legal document. */
export interface LegalSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

/** Props for {@link LegalPage}. */
export interface LegalPageProps {
  title: string;
  /** Plain-language one-paragraph summary shown above the full text. */
  summary: React.ReactNode;
  /** ISO date the document last changed. */
  updated: string;
  /** Current path, used to highlight the sibling-document nav. */
  path: string;
  sections: LegalSection[];
}

/**
 * Shared layout for the legal documents.
 *
 * Each page opens with a plain-language summary — most people will read only
 * that, so it has to be accurate on its own — followed by numbered sections
 * with an in-page table of contents, and links across to the sibling
 * documents.
 */
export function LegalPage({
  title,
  summary,
  updated,
  path,
  sections,
}: LegalPageProps): React.JSX.Element {
  const date = new Intl.DateTimeFormat('en', { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(updated),
  );

  return (
    <main className="container py-8">
      <Breadcrumbs items={[{ label: 'Legal' }, { label: title }]} />

      <div className="mt-8 grid gap-10 lg:grid-cols-[14rem_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav aria-label="Legal documents">
            <p className="eyebrow mb-3">Legal</p>
            <ul className="space-y-1">
              {LEGAL_NAV.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={link.href === path ? 'page' : undefined}
                    className={cn(
                      'block rounded-md px-2.5 py-1.5 text-sm transition-colors',
                      link.href === path
                        ? 'bg-surface-hover text-foreground font-medium'
                        : 'text-text-muted hover:text-foreground',
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="On this page" className="mt-8 hidden lg:block">
            <p className="eyebrow mb-3">On this page</p>
            <ol className="space-y-1.5 text-sm">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-text-muted hover:text-foreground transition-colors"
                  >
                    {index + 1}. {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <article className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="text-text-muted mt-2 text-sm">Last updated {date}</p>

          <div className="bg-surface mt-6 max-w-[72ch] rounded-xl border p-5">
            <p className="eyebrow mb-2">In short</p>
            <div className="text-text-secondary text-sm leading-relaxed">{summary}</div>
          </div>

          <div className="readme mt-8">
            {sections.map((section, index) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2>
                  {index + 1}. {section.title}
                </h2>
                {section.body}
              </section>
            ))}
          </div>
        </article>
      </div>
    </main>
  );
}
