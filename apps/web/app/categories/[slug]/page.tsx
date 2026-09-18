import { CACHE_TTL, CATEGORIES, CATEGORY_LABELS, type Category } from '@mcphub/shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/page-header';
import { ServerCard } from '@/components/server-card';
import { Button } from '@/components/ui/button';
import { cacheKey, cached } from '@/lib/cache';
import { listServers } from '@/lib/queries/servers';
import { safeQuery } from '@/lib/safe-query';

export const revalidate = 3600;

// Deliberately no `generateStaticParams`. Prerendering all sixteen category
// pages would make the build depend on the database being reachable, which it
// is not in CI. ISR generates each on first request and then caches it for an
// hour, which costs one query per category per hour either way.

/** Route params for a category. */
interface PageProps {
  params: Promise<{ slug: string }>;
}

/** True when the slug is one of our known categories. */
function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

/** Per-category FAQ, which is what earns the rich result in search. */
function faqFor(label: string): { q: string; a: string }[] {
  return [
    {
      q: `What is an MCP server for ${label.toLowerCase()}?`,
      a: `It is a small program implementing the Model Context Protocol that gives an AI assistant a safe, structured way to work with ${label.toLowerCase()} tools — exposing specific actions rather than open-ended access.`,
    },
    {
      q: `How do I install one?`,
      a: `Open any server on MCPHub and copy the install command for your client — Claude Desktop, Claude Code, Cursor, Cline, Windsurf, or VS Code. Most are a single npx or uvx command.`,
    },
    {
      q: `Which ${label.toLowerCase()} server should I choose?`,
      a: `Sort by Trust Score. It combines maintenance, popularity, security scanning, and code quality into one 0-100 number, so the top of the list is the safest starting point.`,
    },
    {
      q: `Are these servers safe to run?`,
      a: `MCP servers run on your machine with your permissions, so treat them like any dependency. MCPHub scans every indexed repository weekly for command injection, unsafe filesystem access, and hardcoded credentials, and shows the findings on each server's page.`,
    },
    {
      q: `Is MCPHub free?`,
      a: `Yes. MCPHub is open source under the MIT licence, and every server listed is free and open source too.`,
    },
  ];
}

/** SEO-optimised metadata: this page targets "best X MCP servers". */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isCategory(slug)) return { title: 'Category not found' };

  const label = CATEGORY_LABELS[slug];
  const year = new Date().getFullYear();

  return {
    title: `Best ${label} MCP servers in ${year}`,
    description: `A ranked, security-scanned directory of Model Context Protocol servers for ${label.toLowerCase()}. Compare Trust Scores and copy the install command for your client.`,
    alternates: { canonical: `/categories/${slug}` },
    openGraph: {
      title: `Best ${label} MCP servers in ${year}`,
      description: `Ranked and security-scanned ${label.toLowerCase()} MCP servers.`,
      url: `/categories/${slug}`,
    },
  };
}

/** A category landing page. */
export default async function CategoryPage({ params }: PageProps): Promise<React.JSX.Element> {
  const { slug } = await params;
  if (!isCategory(slug)) notFound();

  const label = CATEGORY_LABELS[slug];
  const year = new Date().getFullYear();

  const page = await safeQuery(
    'category-page',
    { items: [], total: 0, page: 1, pageSize: 24, totalPages: 0, hasMore: false },
    () =>
      cached(cacheKey('category-page', { slug }), { ttl: CACHE_TTL.category }, () =>
        listServers({ category: [slug], sort: 'trust', page: 1, pageSize: 24 }),
      ),
  );

  const faq = faqFor(label);

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <main className="container py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c') }}
      />

      <PageHeader
        crumbs={[{ label: 'Categories', href: '/categories' }, { label }]}
        eyebrow="Category"
        title={`Best ${label} MCP servers in ${year}`}
        description={`${page.total} ${label.toLowerCase()} servers, ranked by Trust Score — a 0-100 measure combining maintenance, popularity, security scanning, and code quality. Every one is open source, and every one shows a copy-paste install command for your MCP client.`}
      />

      {page.items.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed p-10 text-center">
          <p className="text-text-muted text-sm">No servers are indexed in this category yet.</p>
          <Button asChild variant="secondary" className="mt-4">
            <Link href="/submit">Submit one</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {page.items.map((server, index) => (
            <ServerCard key={server.id} server={server} index={index} />
          ))}
        </div>
      )}

      {page.hasMore && (
        <div className="mt-10 flex justify-center">
          <Button asChild variant="secondary" size="lg">
            <Link href={`/servers?category=${slug}`}>See all {page.total} servers</Link>
          </Button>
        </div>
      )}

      <section className="mt-16 max-w-prose">
        <h2 className="text-xl font-semibold tracking-tight">Frequently asked questions</h2>
        <dl className="mt-6 space-y-6">
          {faq.map((item) => (
            <div key={item.q}>
              <dt className="font-medium">{item.q}</dt>
              <dd className="text-text-secondary mt-1.5 text-sm leading-relaxed">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
