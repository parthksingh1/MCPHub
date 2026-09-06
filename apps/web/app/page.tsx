import { Database, ShieldCheck, Sparkles } from 'lucide-react';

/**
 * Foundation placeholder. The real homepage — hero, live stats bar, featured
 * grid, category grid, Trust Score explainer — is built in Phase 4.
 */
export default function HomePage(): React.JSX.Element {
  return (
    <main className="container flex min-h-dvh flex-col justify-center py-24">
      <div className="text-text-muted flex items-center gap-2 text-sm">
        <span className="bg-success inline-flex h-1.5 w-1.5 rounded-full" />
        Phase 1 — Foundation
      </div>

      <h1 className="text-display mt-6 max-w-[16ch] font-semibold tracking-tight">
        The trusted directory for <span className="text-gradient">MCP servers</span>.
      </h1>

      <p className="text-text-secondary mt-6 max-w-prose text-lg leading-relaxed">
        Smithery lists them. MCPHub rates, scans, and vets them. The monorepo, design system, and
        database schema are in place — indexing starts next.
      </p>

      <dl className="mt-14 grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: Database,
            term: 'Indexed',
            detail: 'Postgres full-text search over every server',
          },
          { icon: ShieldCheck, term: 'Scanned', detail: 'Weekly Semgrep + dependency audits' },
          { icon: Sparkles, term: 'Scored', detail: 'A transparent, four-part Trust Score' },
        ].map(({ icon: Icon, term, detail }) => (
          <div
            key={term}
            className="bg-surface hover:border-hover hover:bg-surface-hover rounded-lg border p-5 transition-colors duration-200"
          >
            <Icon className="text-accent h-5 w-5" aria-hidden />
            <dt className="mt-3 font-medium">{term}</dt>
            <dd className="text-text-muted mt-1 text-sm">{detail}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
