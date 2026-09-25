import { CACHE_TTL } from '@mcphub/shared';
import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { PageHeader } from '@/components/page-header';
import { cacheKey, cached } from '@/lib/cache';
import { COLLECTIONS, collectionQuery } from '@/lib/collections';
import { listServers, type ServerPage } from '@/lib/queries/servers';
import { safeQuery } from '@/lib/safe-query';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Curated MCP server collections',
  description:
    'The best MCP servers for common jobs — coding agents, DevOps, databases, browser automation and more — ranked by Trust Score and updated daily.',
  alternates: { canonical: '/collections' },
};

const EMPTY: ServerPage = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 4,
  totalPages: 0,
  hasMore: false,
};

/** Index of every curated collection, each previewing its top servers. */
export default async function CollectionsPage(): Promise<React.JSX.Element> {
  const previews = await Promise.all(
    COLLECTIONS.map((collection) =>
      safeQuery(`collection:${collection.slug}`, EMPTY, () =>
        cached(
          cacheKey('collection-preview', { slug: collection.slug }),
          { ttl: CACHE_TTL.category },
          () => listServers(collectionQuery(collection, 5)),
        ),
      ),
    ),
  );

  return (
    <main className="container py-8">
      <PageHeader
        crumbs={[{ label: 'Collections' }]}
        title="Collections"
        description="Hand-picked themes for common jobs, each filled with the highest-scoring servers for it and updated daily. Nothing here is paid for."
      />

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {COLLECTIONS.map((collection, index) => {
          const preview = previews[index] ?? EMPTY;
          return (
            <Link
              key={collection.slug}
              href={`/collections/${collection.slug}`}
              className="bg-surface hover:border-hover group flex flex-col rounded-2xl border p-6 transition-colors"
            >
              <div className="flex items-start gap-4">
                <span className="bg-surface-hover text-foreground flex size-11 shrink-0 items-center justify-center rounded-xl border">
                  <collection.icon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold tracking-tight">{collection.title}</h2>
                  <p className="text-text-muted mt-1 text-sm leading-relaxed">
                    {collection.tagline}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-4 border-t pt-4">
                <div className="flex items-center">
                  {preview.items.map((server, position) => (
                    <span
                      key={server.id}
                      title={server.name}
                      className="bg-surface-hover ring-surface -ml-2 flex size-8 items-center justify-center overflow-hidden rounded-lg ring-2 first:ml-0"
                      style={{ zIndex: 10 - position }}
                    >
                      {server.authorAvatar ? (
                        <Image
                          src={server.authorAvatar}
                          alt=""
                          width={32}
                          height={32}
                          className="size-8 object-cover"
                        />
                      ) : (
                        <span className="text-text-muted font-mono text-xs uppercase">
                          {server.name.slice(0, 1)}
                        </span>
                      )}
                    </span>
                  ))}
                  {preview.total > 0 && (
                    <span className="text-text-muted ml-3 text-sm tabular-nums">
                      {preview.total.toLocaleString()} servers
                    </span>
                  )}
                </div>
                <span className="text-foreground inline-flex items-center gap-1 text-sm font-medium">
                  View
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
