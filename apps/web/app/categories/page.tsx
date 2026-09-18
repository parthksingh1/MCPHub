import { CACHE_TTL, CATEGORY_LABELS } from '@mcphub/shared';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/page-header';
import { cacheKey, cached } from '@/lib/cache';
import { CATEGORY_ICON } from '@/lib/category-icons';
import { getCategoryCounts } from '@/lib/queries/servers';
import { safeQuery } from '@/lib/safe-query';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'MCP server categories',
  description:
    'Every category of Model Context Protocol server — databases, browsers, DevOps, AI, and more.',
  alternates: { canonical: '/categories' },
};

/** Short blurbs so each category card says something useful. */
const BLURBS: Record<string, string> = {
  database: 'Query and manage Postgres, MySQL, SQLite, MongoDB, and more.',
  browser: 'Drive a real browser: navigate, scrape, screenshot, and automate.',
  communication: 'Slack, Discord, email, and messaging platforms.',
  devtools: 'GitHub, GitLab, issue trackers, and the rest of the toolchain.',
  devops: 'Kubernetes, Docker, Terraform, and deployment pipelines.',
  ai: 'Model providers, embeddings, vector stores, and RAG.',
  productivity: 'Notion, Obsidian, calendars, and task managers.',
  files: 'Local filesystems, cloud storage, and document handling.',
  search: 'Web search, site search, and search engines.',
  finance: 'Payments, accounting, markets, and financial data.',
  cloud: 'AWS, Azure, GCP, Cloudflare, and platform APIs.',
  security: 'Scanners, secret management, and identity providers.',
  monitoring: 'Metrics, logs, traces, and observability platforms.',
  design: 'Figma, image generation, and visual tooling.',
  data: 'Analytics, warehouses, notebooks, and data pipelines.',
  other: 'Everything that does not fit neatly elsewhere.',
};

/** Index of every category, linking to its dedicated landing page. */
export default async function CategoriesPage(): Promise<React.JSX.Element> {
  const categories = await safeQuery('categories', [], () =>
    cached(cacheKey('categories'), { ttl: CACHE_TTL.category }, () => getCategoryCounts()),
  );

  const sorted = [...categories].sort((a, b) => b.count - a.count);

  return (
    <main className="container py-8">
      <PageHeader
        crumbs={[{ label: 'Categories' }]}
        eyebrow="Directory"
        title="Categories"
        description="Browse MCP servers by what they connect to."
      />

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((category) => {
          const Icon = CATEGORY_ICON[category.slug];
          return (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              className="bg-surface hover:border-hover hover:bg-surface-hover group flex gap-4 rounded-xl border p-5 transition-colors"
            >
              <span className="bg-background text-text-muted group-hover:text-foreground flex size-10 shrink-0 items-center justify-center rounded-lg border transition-colors">
                <Icon className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-medium">{CATEGORY_LABELS[category.slug]}</h2>
                  <span className="text-text-muted text-xs tabular-nums">
                    {category.count} {category.count === 1 ? 'server' : 'servers'}
                  </span>
                </div>
                <p className="text-text-muted mt-1.5 text-sm leading-relaxed">
                  {BLURBS[category.slug] ?? ''}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
