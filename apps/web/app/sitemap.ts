import { CATEGORIES } from '@mcphub/shared';
import type { MetadataRoute } from 'next';

import { getAllSlugs } from '@/lib/queries/servers';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/** Regenerate daily, alongside the crawl. */
export const revalidate = 86_400;

/**
 * The sitemap.
 *
 * Server detail pages carry the highest priority: they are the pages with
 * unique content, and they are what should rank. Their `lastModified` comes
 * from the row's own `updatedAt`, so a re-crawl legitimately signals a change
 * rather than the whole sitemap claiming to be fresh every day.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // A database blip must not fail a deployment. If the servers cannot be
  // listed, ship the static and category entries and let the next daily
  // revalidation pick up the rest — a partial sitemap is recoverable, a failed
  // build is not.
  let servers: { slug: string; updatedAt: Date }[] = [];

  try {
    servers = await getAllSlugs();
  } catch (error) {
    console.error('[sitemap] could not list servers:', error);
  }

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/servers`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/categories`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/rankings`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteUrl}/badges`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/security`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${siteUrl}/legal/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${siteUrl}/legal/terms`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${siteUrl}/legal/removal`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/legal/sponsored`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${siteUrl}/trust-score`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/submit`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/blog`, changeFrequency: 'weekly', priority: 0.6 },
  ];

  const categoryPages: MetadataRoute.Sitemap = CATEGORIES.map((slug) => ({
    url: `${siteUrl}/categories/${slug}`,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const serverPages: MetadataRoute.Sitemap = servers.map((server) => ({
    url: `${siteUrl}/servers/${server.slug}`,
    lastModified: server.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticPages, ...categoryPages, ...serverPages];
}
