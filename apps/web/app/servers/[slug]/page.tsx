import { getTrustLabel } from '@mcphub/scoring';
import { CACHE_TTL, CATEGORY_LABELS, serverSecuritySchema, type Category } from '@mcphub/shared';
import {
  AlertTriangle,
  BadgeCheck,
  Boxes,
  ExternalLink,
  GitFork,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Star,
} from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { BadgeCta } from '@/components/badge-cta';
import { InstallCommand } from '@/components/install-command';
import { ServerActions } from '@/components/server-actions';
import { ServerCard } from '@/components/server-card';
import { TrustScoreRing } from '@/components/trust-score-ring';
import { Badge } from '@/components/ui/badge';
import { cacheKey, cached } from '@/lib/cache';
import { formatCount, formatDate, formatLicense, formatRelativeTime } from '@/lib/format';
import { getRelatedServers, getServerBySlug } from '@/lib/queries/servers';
import { SITE_URL } from '@/lib/site';

/**
 * Five minutes. This page is roughly 90% of MCPHub's traffic, so its ISR
 * window is the single most important caching decision on the site.
 */
export const revalidate = 300;

/** Route params for a single server. */
interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Loads a server through the shared cache. */
async function loadServer(slug: string) {
  return cached(cacheKey('server', { slug }), { ttl: CACHE_TTL.detail }, () =>
    getServerBySlug(slug),
  );
}

/** Per-server metadata, so every detail page is a distinct search result. */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const server = await loadServer(slug);

  if (!server) return { title: 'Server not found' };

  const title = `${server.name} — MCP server`;
  const description = server.description.slice(0, 160);

  return {
    title,
    description,
    alternates: { canonical: `/servers/${server.slug}` },
    openGraph: { title, description, type: 'article', url: `/servers/${server.slug}` },
    twitter: { card: 'summary_large_image', title, description },
  };
}

/** Severity styling for a security finding chip. */
const SEVERITY_VARIANT = {
  critical: 'danger',
  high: 'danger',
  medium: 'warn',
  low: 'default',
  info: 'default',
} as const;

/** The server detail page. */
export default async function ServerDetailPage({ params }: PageProps): Promise<React.JSX.Element> {
  const { slug } = await params;
  const server = await loadServer(slug);

  if (!server) notFound();

  const related = await cached(cacheKey('related', { slug }), { ttl: CACHE_TTL.detail }, () =>
    getRelatedServers(server.id, server.categories, 6),
  );

  const security = serverSecuritySchema.safeParse(server.security);
  const findings = security.success ? security.data.findings : [];
  const scanned = security.success && security.data.scanned;
  const audit = security.success ? security.data.dependencyAudit : undefined;

  const trustParts = [
    { name: 'Maintenance', value: server.trustMaintenance },
    { name: 'Popularity', value: server.trustPopularity },
    { name: 'Security', value: server.trustSecurity },
    { name: 'Quality', value: server.trustQuality },
  ];

  /**
   * Structured data so search engines can render a rich result.
   * `SoftwareApplication` is the closest schema.org type to an MCP server.
   */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: server.name,
    description: server.description,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Cross-platform',
    codeRepository: server.repoUrl,
    ...(server.license ? { license: server.license } : {}),
    ...(server.authorName ? { author: { '@type': 'Person', name: server.authorName } } : {}),
    ...(server.ratingCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: server.ratingAvg,
            ratingCount: server.ratingCount,
          },
        }
      : {}),
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };

  return (
    <main className="container py-10">
      <script
        type="application/ld+json"
        // Serialising via JSON.stringify and escaping `<` prevents a server
        // description containing "</script>" from breaking out of the tag.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <nav aria-label="Breadcrumb" className="text-text-muted text-sm">
        <Link href="/servers" className="hover:text-foreground transition-colors">
          Servers
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-text-secondary">{server.name}</span>
      </nav>

      {server.deprecated && (
        <div className="border-danger/30 bg-danger/10 mt-6 flex items-start gap-3 rounded-lg border p-4">
          <AlertTriangle className="text-danger mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="text-sm">
            <p className="text-danger font-medium">This server is deprecated</p>
            <p className="text-text-secondary mt-1">
              Its repository has been archived or removed. It is kept here so existing links keep
              working, but it should not be installed.
            </p>
          </div>
        </div>
      )}

      {/* ── Above the fold ───────────────────────────────────────────────── */}
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0">
          <div className="flex items-start gap-4">
            {server.authorAvatar && (
              <Image
                src={server.authorAvatar}
                alt=""
                width={48}
                height={48}
                className="size-12 shrink-0 rounded-lg border"
              />
            )}

            <div className="min-w-0 flex-1">
              <h1 className="flex flex-wrap items-center gap-2 text-3xl font-semibold tracking-tight">
                {server.name}
                {server.verified && (
                  <BadgeCheck className="text-accent size-5" aria-label="Verified by MCPHub" />
                )}
              </h1>

              <div className="text-text-muted mt-1.5 flex flex-wrap items-center gap-2 text-sm">
                {server.authorName && <span>by {server.authorName}</span>}
                {server.isOfficial && <Badge variant="accent">Official</Badge>}
                {server.categories.map((category) => (
                  <Link key={category} href={`/categories/${category}`}>
                    <Badge className="hover:bg-surface transition-colors">
                      {CATEGORY_LABELS[category as Category] ?? category}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>

            <div className="hidden shrink-0 text-center lg:block">
              <TrustScoreRing score={server.trustTotal} size={72} strokeWidth={5} showLabel />
            </div>
          </div>

          <p className="text-text-secondary mt-5 max-w-prose text-lg leading-relaxed">
            {server.description}
          </p>

          <ServerActions
            slug={server.slug}
            ratingAvg={Number(server.ratingAvg)}
            ratingCount={server.ratingCount}
            className="mt-6"
          />

          <h2 className="text-text-muted mt-10 text-sm font-medium uppercase tracking-wide">
            Install
          </h2>
          <InstallCommand commands={server.installCommands} slug={server.slug} className="mt-3" />

          {/* ── Tools ─────────────────────────────────────────────────────── */}
          {server.capabilities?.tools && server.capabilities.tools.length > 0 && (
            <section className="mt-10">
              <h2 className="text-text-muted flex items-center gap-2 text-sm font-medium uppercase tracking-wide">
                <Boxes className="size-4" aria-hidden />
                Tools ({server.capabilities.tools.length})
              </h2>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {server.capabilities.tools.map((tool) => (
                  <li key={tool.name}>
                    <code className="bg-surface rounded-sm border px-2 py-1 font-mono text-xs">
                      {tool.name}
                    </code>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── Security ──────────────────────────────────────────────────── */}
          <section className="mt-10">
            <h2 className="text-text-muted flex items-center gap-2 text-sm font-medium uppercase tracking-wide">
              {findings.length > 0 ? (
                <ShieldAlert className="size-4" aria-hidden />
              ) : (
                <ShieldCheck className="size-4" aria-hidden />
              )}
              Security
            </h2>

            <div className="bg-surface mt-3 rounded-lg border p-5">
              {!scanned ? (
                // Saying "no findings" for a server nobody has scanned would be
                // actively misleading — it is the difference between "we
                // checked and it is clean" and "we have not checked".
                <p className="text-text-secondary text-sm">
                  <span className="text-foreground font-medium">Not yet scanned.</span> This server
                  is queued for the weekly security scan. Absence of findings here does not mean
                  absence of risk — review the source before installing.
                </p>
              ) : findings.length === 0 ? (
                <p className="text-text-secondary text-sm">
                  <span className="text-success font-medium">No findings.</span> The last scan found
                  no matches against the MCP ruleset
                  {audit && audit.total === 0 ? ' and no dependency advisories' : ''}.
                </p>
              ) : (
                <ul className="space-y-3">
                  {findings.slice(0, 12).map((finding, index) => (
                    <li key={`${finding.ruleId}-${index}`} className="flex items-start gap-3">
                      <Badge variant={SEVERITY_VARIANT[finding.severity]}>{finding.severity}</Badge>
                      <div className="min-w-0 text-sm">
                        <p className="text-text-secondary">{finding.message}</p>
                        {finding.file && (
                          <p className="text-text-muted mt-0.5 truncate font-mono text-xs">
                            {finding.file}
                            {finding.line ? `:${finding.line}` : ''}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {audit && audit.total > 0 && (
                <p className="text-text-muted mt-4 border-t pt-4 text-sm">
                  Dependency audit ({audit.tool}): {audit.critical} critical, {audit.high} high,{' '}
                  {audit.medium} medium, {audit.low} low.
                </p>
              )}
            </div>
          </section>

          {/* ── Trust breakdown ───────────────────────────────────────────── */}
          <section className="mt-10">
            <h2 className="text-text-muted text-sm font-medium uppercase tracking-wide">
              Trust Score breakdown
            </h2>
            <div className="bg-surface mt-3 rounded-lg border p-5">
              <p className="text-text-secondary mb-4 text-sm">
                <span className="text-foreground font-medium">
                  {server.trustTotal}/100 — {getTrustLabel(server.trustTotal)}
                </span>
              </p>

              <dl className="space-y-3">
                {trustParts.map((part) => (
                  <div
                    key={part.name}
                    className="grid grid-cols-[7rem_1fr_2.5rem] items-center gap-3"
                  >
                    <dt className="text-text-secondary text-sm">{part.name}</dt>
                    <dd className="bg-surface-hover h-1.5 overflow-hidden rounded-full">
                      <div
                        className="from-accent-from to-accent-to h-full rounded-full bg-gradient-to-r"
                        style={{ width: `${(part.value / 25) * 100}%` }}
                      />
                    </dd>
                    <dd className="text-text-muted text-right font-mono text-xs tabular-nums">
                      {part.value}/25
                    </dd>
                  </div>
                ))}
              </dl>

              <Link
                href="/trust-score"
                className="text-accent mt-5 inline-block text-sm transition-opacity hover:opacity-80"
              >
                How is this calculated? →
              </Link>
            </div>
          </section>

          <BadgeCta
            slug={server.slug}
            name={server.name}
            trustTotal={server.trustTotal}
            siteUrl={SITE_URL}
            className="mt-10"
          />
        </div>

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside className="space-y-6">
          <div className="lg:hidden">
            <TrustScoreRing score={server.trustTotal} size={72} strokeWidth={5} showLabel />
          </div>

          <dl className="bg-surface space-y-3 rounded-lg border p-5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-text-muted flex items-center gap-1.5">
                <Star className="size-3.5" aria-hidden />
                Stars
              </dt>
              <dd className="tabular-nums">{formatCount(server.githubStars)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-text-muted flex items-center gap-1.5">
                <GitFork className="size-3.5" aria-hidden />
                Forks
              </dt>
              <dd className="tabular-nums">{formatCount(server.githubForks)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-text-muted flex items-center gap-1.5">
                <Scale className="size-3.5" aria-hidden />
                Licence
              </dt>
              <dd>{formatLicense(server.license) ?? 'Unknown'}</dd>
            </div>
            {server.language && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-text-muted">Language</dt>
                <dd className="capitalize">{server.language}</dd>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <dt className="text-text-muted">Last commit</dt>
              <dd title={formatDate(server.lastCommitAt)}>
                {formatRelativeTime(server.lastCommitAt)}
              </dd>
            </div>
            {server.npmWeeklyDownloads !== null && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-text-muted">npm / week</dt>
                <dd className="tabular-nums">{formatCount(server.npmWeeklyDownloads)}</dd>
              </div>
            )}
          </dl>

          <div className="space-y-2">
            <a
              href={server.repoUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="bg-surface hover:border-hover hover:bg-surface-hover flex items-center justify-between gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors"
            >
              View source
              <ExternalLink className="text-text-muted size-3.5" aria-hidden />
            </a>
            {server.homepageUrl && (
              <a
                href={server.homepageUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="bg-surface hover:border-hover hover:bg-surface-hover flex items-center justify-between gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors"
              >
                Homepage
                <ExternalLink className="text-text-muted size-3.5" aria-hidden />
              </a>
            )}
          </div>

          {server.tags.length > 0 && (
            <div>
              <h2 className="text-text-muted mb-2 text-xs font-medium uppercase tracking-wide">
                Tags
              </h2>
              <ul className="flex flex-wrap gap-1.5">
                {server.tags.map((tag) => (
                  <li key={tag}>
                    <Badge variant="outline">{tag}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-text-muted text-xs">
            Something wrong with this listing?{' '}
            <Link href={`/servers/${server.slug}/report`} className="underline underline-offset-2">
              Report it
            </Link>
            .
          </p>
        </aside>
      </div>

      {/* ── Related ──────────────────────────────────────────────────────── */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-semibold tracking-tight">Alternatives</h2>
          <p className="text-text-muted mt-1 text-sm">Other servers in the same categories.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item, index) => (
              <ServerCard key={item.id} server={item} index={index} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
