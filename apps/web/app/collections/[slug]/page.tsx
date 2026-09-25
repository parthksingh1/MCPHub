import { CACHE_TTL } from '@mcphub/shared';
import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/page-header';
import { ServerCard } from '@/components/server-card';
import { Button } from '@/components/ui/button';
import { cacheKey, cached } from '@/lib/cache';
import { COLLECTIONS, collectionQuery, getCollection } from '@/lib/collections';
import { listServers, type ServerPage } from '@/lib/queries/servers';
import { safeQuery } from '@/lib/safe-query';

export const revalidate = 3600;

/** Next 15 passes params as a promise. */
interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Every collection is known at build time. */
export function generateStaticParams(): { slug: string }[] {
  return COLLECTIONS.map((collection) => ({ slug: collection.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const collection = getCollection((await params).slug);
  if (!collection) return {};
  return {
    title: `${collection.title} — best MCP servers`,
    description: collection.description,
    alternates: { canonical: `/collections/${collection.slug}` },
  };
}

const EMPTY: ServerPage = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 24,
  totalPages: 0,
  hasMore: false,
};

/** One collection: its top servers, ranked by Trust Score. */
export default async function CollectionPage({ params }: PageProps): Promise<React.JSX.Element> {
  const collection = getCollection((await params).slug);
  if (!collection) notFound();

  const page = await safeQuery(`collection:${collection.slug}`, EMPTY, () =>
    cached(cacheKey('collection', { slug: collection.slug }), { ttl: CACHE_TTL.category }, () =>
      listServers(collectionQuery(collection, 24)),
    ),
  );

  // The same filter on the browse page, for anyone who wants the full list.
  const browse = new URLSearchParams();
  for (const category of collection.filter.category ?? []) browse.append('category', category);
  if (collection.filter.official) browse.set('official', 'true');
  if (collection.filter.minTrust) browse.set('minTrust', String(collection.filter.minTrust));

  return (
    <main className="container py-8">
      <PageHeader
        crumbs={[{ label: 'Collections', href: '/collections' }, { label: collection.title }]}
        title={collection.title}
        description={collection.description}
      />

      <p className="text-text-muted mt-4 text-sm">
        Ranked by Trust Score · {page.total.toLocaleString()} servers qualify · updated daily
      </p>

      {page.items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed p-16 text-center">
          <p className="font-semibold">Nothing here yet</p>
          <p className="text-text-muted mt-1 text-sm">
            Servers appear here as soon as they meet this collection’s bar.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {page.items.map((server, index) => (
            <ServerCard key={server.id} server={server} index={index} />
          ))}
        </div>
      )}

      {page.total > page.items.length && (
        <div className="mt-12 flex justify-center">
          <Button asChild variant="secondary" size="lg" className="rounded-xl">
            <Link href={`/servers?${browse}`}>
              See all {page.total.toLocaleString()}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      )}

      <nav aria-label="Other collections" className="mt-16 border-t pt-8">
        <p className="text-sm font-semibold">More collections</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {COLLECTIONS.filter((other) => other.slug !== collection.slug).map((other) => (
            <li key={other.slug}>
              <Link
                href={`/collections/${other.slug}`}
                className="bg-surface hover:border-hover inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm transition-colors"
              >
                <other.icon className="text-text-muted size-4" aria-hidden />
                {other.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
