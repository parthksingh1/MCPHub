import { CACHE_TTL, CATEGORY_LABELS } from '@mcphub/shared';
import type { Metadata } from 'next';
import Link from 'next/link';

import { cacheKey, cached } from '@/lib/cache';
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
    <main className="container py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Categories</h1>
      <p className="text-text-secondary mt-2 max-w-prose">
        Browse MCP servers by what they connect to.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((category) => (
          <Link
            key={category.slug}
            href={`/categories/${category.slug}`}
            className="bg-surface hover:border-hover hover:bg-surface-hover group rounded-lg border p-5 transition-all duration-200 ease-out hover:-translate-y-0.5"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-medium">{CATEGORY_LABELS[category.slug]}</h2>
              <span className="text-text-muted text-xs tabular-nums">{category.count}</span>
            </div>
            <p className="text-text-muted mt-2 text-sm leading-relaxed">
              {BLURBS[category.slug] ?? ''}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
