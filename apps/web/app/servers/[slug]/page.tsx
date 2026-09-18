import { parseGitHubUrl } from '@mcphub/crawler';
import { getTrustLabel } from '@mcphub/scoring';
import { CACHE_TTL, CATEGORY_LABELS, serverSecuritySchema, type Category } from '@mcphub/shared';
import {
  AlertTriangle,
  BadgeCheck,
  Boxes,
  Calendar,
  Code2,
  Download,
  ExternalLink,
  FileText,
  Flag,
  GitCompare,
  GitFork,
  Github,
  Globe,
  Package,
  Scale,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Star,
  Wrench,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { BadgeCta } from '@/components/badge-cta';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { InstallCommand } from '@/components/install-command';
import { Readme } from '@/components/readme';
import { ServerActions } from '@/components/server-actions';
import { ServerCard } from '@/components/server-card';
import { TrustScoreRing } from '@/components/trust-score-ring';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cacheKey, cached } from '@/lib/cache';
import { categoryStyle } from '@/lib/category-style';
import { formatCount, formatDate, formatLicense, formatRelativeTime } from '@/lib/format';
import { getRelatedServers, getServerBySlug } from '@/lib/queries/servers';
import { SITE_URL } from '@/lib/site';
import { cn } from '@/lib/utils';

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

/** One figure in the stats strip. */
function Stat({
  icon: Icon,
  label,
  value,
  title,
}: {
  icon: typeof Star;
  label: string;
  value: string;
  title?: string;
}): React.JSX.Element {
  return (
    <div className="min-w-0 px-4 py-3" title={title}>
      <dt className="text-text-muted flex items-center gap-1.5 text-xs">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-medium tabular-nums">{value}</dd>
    </div>
  );
}

/**
 * The server detail page.
 *
 * Restructured around the question a visitor arrives with — "should I install
 * this, and how?" The header answers "what is it and can I trust it", the
 * sticky sidebar keeps the install command in view while reading, and the
 * tabs split the README, tools, security findings and score breakdown so none
 * of them buries the others.
 */
export default async function ServerDetailPage({ params }: PageProps): Promise<React.JSX.Element> {
  const { slug } = await params;
  const server = await loadServer(slug);

  if (!server) notFound();

  const related = await cached(cacheKey('related', { slug }), { ttl: CACHE_TTL.detail }, () =>
    getRelatedServers(server.id, server.categories, 6),
  );

  const identity = parseGitHubUrl(server.repoUrl);
  const repo = identity ? `${identity.owner}/${identity.repo}` : null;

  const security = serverSecuritySchema.safeParse(server.security);
  const findings = security.success ? security.data.findings : [];
  const scanned = security.success && security.data.scanned;
  const lastScanAt = security.success ? security.data.lastScanAt : null;
  const audit = security.success ? security.data.dependencyAudit : undefined;

  const tools = server.capabilities?.tools ?? [];
  const primaryCategory = server.categories[0] as Category | undefined;

  const packageUrl =
    server.packageName && server.sourceType === 'npm'
      ? `https://www.npmjs.com/package/${server.packageName}`
      : server.packageName && server.sourceType === 'pypi'
        ? `https://pypi.org/project/${server.packageName}`
        : null;

  const trustParts = [
    { name: 'Maintenance', value: server.trustMaintenance, hint: 'Commit and release recency' },
    { name: 'Popularity', value: server.trustPopularity, hint: 'Stars and downloads, log scale' },
    { name: 'Security', value: server.trustSecurity, hint: 'Scanner findings and advisories' },
    { name: 'Quality', value: server.trustQuality, hint: 'README, licence, types, tests, CI' },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: server.name,
    description: server.description,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Cross-platform',
    codeRepository: server.repoUrl,
    url: `${SITE_URL}/servers/${server.slug}`,
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
    <main className="container py-8">
      <script
        type="application/ld+json"
        // Escaping `<` stops a description containing "</script>" from
        // breaking out of the tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <Breadcrumbs
        items={[
          { label: 'Servers', href: '/servers' },
          ...(primaryCategory
            ? [
                {
                  label: CATEGORY_LABELS[primaryCategory] ?? primaryCategory,
                  href: `/categories/${primaryCategory}`,
                },
              ]
            : []),
          { label: server.name },
        ]}
      />

      {server.deprecated && (
        <div
          role="alert"
          className="border-danger/30 bg-danger/10 mt-6 flex items-start gap-3 rounded-xl border p-4"
        >
          <AlertTriangle className="text-danger mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="text-sm">
            <p className="text-danger font-medium">This server is deprecated</p>
            <p className="text-text-secondary mt-1">
              Its repository has been archived or removed. The page stays so existing links keep
              working, but it should not be installed.
            </p>
          </div>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-4">
          <Avatar className="size-14 rounded-xl">
            {server.authorAvatar && <AvatarImage src={server.authorAvatar} alt="" />}
            <AvatarFallback className="text-sm">{server.name.slice(0, 2)}</AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              <span className="break-words">{server.name}</span>
              {server.verified && (
                <BadgeCheck className="text-accent size-6" aria-label="Verified by MCPHub" />
              )}
            </h1>

            <p className="text-text-muted mt-1 text-sm">
              {server.authorName ? (
                <>
                  by{' '}
                  <span className="text-text-secondary font-mono text-[13px]">
                    {server.authorName}
                  </span>
                </>
              ) : (
                'Unknown author'
              )}
              {server.packageName && (
                <>
                  <span className="mx-2" aria-hidden>
                    ·
                  </span>
                  <span className="font-mono text-[13px]">{server.packageName}</span>
                </>
              )}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {server.isOfficial && (
                <Badge variant="accent">
                  <BadgeCheck aria-hidden />
                  Official
                </Badge>
              )}
              {scanned ? (
                findings.length === 0 ? (
                  <Badge variant="success">
                    <ShieldCheck aria-hidden />
                    Scan clean
                  </Badge>
                ) : (
                  <Badge variant="warn">
                    <ShieldAlert aria-hidden />
                    {findings.length} finding{findings.length === 1 ? '' : 's'}
                  </Badge>
                )
              ) : (
                <Badge variant="outline">
                  <ShieldQuestion aria-hidden />
                  Not yet scanned
                </Badge>
              )}
              {server.categories.map((category) => (
                <Link
                  key={category}
                  href={`/categories/${category}`}
                  className={cn(
                    'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-80',
                    categoryStyle(category).chip,
                  )}
                >
                  {CATEGORY_LABELS[category as Category] ?? category}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-end">
          <TrustScoreRing score={server.trustTotal} size={76} strokeWidth={5} showLabel />
        </div>
      </header>

      <p className="text-text-secondary mt-6 max-w-[72ch] text-base leading-relaxed">
        {server.description}
      </p>

      {/* ── Actions ────────────────────────────────────────────────────────── */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Button asChild variant="secondary" size="sm">
          <a href={server.repoUrl} target="_blank" rel="noreferrer noopener">
            <Github aria-hidden />
            Source
          </a>
        </Button>
        {related[0] && (
          <Button asChild variant="secondary" size="sm">
            <Link href={`/compare?a=${server.slug}&b=${related[0].slug}`}>
              <GitCompare aria-hidden />
              Compare
            </Link>
          </Button>
        )}
        <ServerActions
          slug={server.slug}
          ratingAvg={Number(server.ratingAvg)}
          ratingCount={server.ratingCount}
          className="ml-1"
        />
      </div>

      {/* ── Stats strip ────────────────────────────────────────────────────── */}
      <dl className="bg-surface mt-6 grid grid-cols-2 divide-y rounded-xl border sm:grid-cols-3 sm:divide-y-0 lg:grid-cols-6 lg:divide-x">
        <Stat icon={Star} label="Stars" value={formatCount(server.githubStars)} />
        <Stat icon={GitFork} label="Forks" value={formatCount(server.githubForks)} />
        <Stat icon={Scale} label="Licence" value={formatLicense(server.license) ?? 'Unknown'} />
        <Stat
          icon={Code2}
          label="Language"
          value={
            server.language ? server.language[0]?.toUpperCase() + server.language.slice(1) : '—'
          }
        />
        <Stat
          icon={Calendar}
          label="Last commit"
          value={formatRelativeTime(server.lastCommitAt)}
          title={formatDate(server.lastCommitAt)}
        />
        <Stat
          icon={Download}
          label="npm / week"
          value={server.npmWeeklyDownloads !== null ? formatCount(server.npmWeeklyDownloads) : '—'}
        />
      </dl>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Tabs defaultValue="overview" className="min-w-0">
          <TabsList aria-label="Server details">
            <TabsTrigger value="overview">
              <FileText className="size-3.5" aria-hidden />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tools">
              <Wrench className="size-3.5" aria-hidden />
              Tools
              <span className="text-text-muted tabular-nums">{tools.length}</span>
            </TabsTrigger>
            <TabsTrigger value="security">
              <ShieldCheck className="size-3.5" aria-hidden />
              Security
            </TabsTrigger>
            <TabsTrigger value="trust">Trust Score</TabsTrigger>
            <TabsTrigger value="alternatives">
              Alternatives
              <span className="text-text-muted tabular-nums">{related.length}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {server.longDescription ? (
              <Readme markdown={server.longDescription} repo={repo} />
            ) : (
              <p className="text-text-muted text-sm">
                This server has no README. See the{' '}
                <a href={server.repoUrl} className="underline underline-offset-2">
                  repository
                </a>{' '}
                for setup instructions.
              </p>
            )}
          </TabsContent>

          <TabsContent value="tools">
            {tools.length > 0 ? (
              <ul className="divide-y rounded-xl border">
                {tools.map((tool) => (
                  <li key={tool.name} className="flex items-start gap-3 px-4 py-3">
                    <Boxes className="text-text-muted mt-0.5 size-4 shrink-0" aria-hidden />
                    <div className="min-w-0">
                      <code className="font-mono text-sm">{tool.name}</code>
                      {tool.description && (
                        <p className="text-text-muted mt-0.5 text-sm">{tool.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-text-muted text-sm">
                No tools were documented in this server&apos;s README. The server may still expose
                tools — they are discovered at runtime by your MCP client.
              </p>
            )}
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardContent className="p-5">
                {!scanned ? (
                  <p className="text-text-secondary text-sm leading-relaxed">
                    <span className="text-foreground font-medium">Not yet scanned.</span> This
                    server is queued for the weekly scan. No findings here does <em>not</em> mean no
                    risk — review the source before installing.
                  </p>
                ) : findings.length === 0 ? (
                  <p className="text-text-secondary text-sm leading-relaxed">
                    <span className="text-success font-medium">No findings.</span> The last scan
                    {lastScanAt ? ` (${formatDate(lastScanAt)})` : ''} matched nothing in the MCP
                    ruleset
                    {audit && audit.total === 0 ? ' and found no dependency advisories' : ''}.
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {findings.slice(0, 20).map((finding, index) => (
                      <li key={`${finding.ruleId}-${index}`} className="flex items-start gap-3">
                        <Badge variant={SEVERITY_VARIANT[finding.severity]} className="capitalize">
                          {finding.severity}
                        </Badge>
                        <div className="min-w-0 text-sm">
                          <p className="text-text-secondary">{finding.message}</p>
                          {finding.file && (
                            <p className="text-text-muted mt-1 truncate font-mono text-xs">
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
                  <p className="text-text-muted mt-5 border-t pt-4 text-sm">
                    Dependency audit ({audit.tool}): {audit.critical} critical, {audit.high} high,{' '}
                    {audit.medium} medium, {audit.low} low.
                  </p>
                )}
              </CardContent>
            </Card>
            <p className="text-text-muted mt-4 text-xs">
              What the scan covers and what it cannot tell you:{' '}
              <Link href="/security" className="underline underline-offset-2">
                security policy
              </Link>
              .
            </p>
          </TabsContent>

          <TabsContent value="trust">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {server.trustTotal}/100 — {getTrustLabel(server.trustTotal)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  {trustParts.map((part) => (
                    <div key={part.name}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <dt>
                          {part.name}
                          <span className="text-text-muted ml-2 text-xs">{part.hint}</span>
                        </dt>
                        <dd className="font-mono text-xs tabular-nums">{part.value}/25</dd>
                      </div>
                      <div className="bg-surface-hover mt-2 h-1.5 overflow-hidden rounded-full">
                        <div
                          className="bg-foreground h-full rounded-full"
                          style={{ width: `${(part.value / 25) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </dl>
                <Link
                  href="/trust-score"
                  className="text-text-secondary hover:text-foreground mt-6 inline-block text-sm underline underline-offset-2"
                >
                  How the score is calculated
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alternatives">
            {related.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {related.map((item, index) => (
                  <ServerCard key={item.id} server={item} index={index} />
                ))}
              </div>
            ) : (
              <p className="text-text-muted text-sm">
                No alternatives indexed in these categories yet.
              </p>
            )}
          </TabsContent>
        </Tabs>

        {/* ── Sidebar ────────────────────────────────────────────────────── */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <section aria-labelledby="install-heading">
            <h2 id="install-heading" className="eyebrow mb-2">
              Install
            </h2>
            <InstallCommand commands={server.installCommands} slug={server.slug} />
          </section>

          <Card>
            <CardContent className="space-y-1 p-2">
              <a
                href={server.repoUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="hover:bg-surface-hover flex min-h-10 items-center justify-between gap-2 rounded-md px-3 text-sm transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Github className="text-text-muted size-4" aria-hidden />
                  Repository
                </span>
                <ExternalLink className="text-text-muted size-3.5" aria-hidden />
              </a>
              {packageUrl && (
                <a
                  href={packageUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="hover:bg-surface-hover flex min-h-10 items-center justify-between gap-2 rounded-md px-3 text-sm transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Package className="text-text-muted size-4" aria-hidden />
                    {server.sourceType === 'pypi' ? 'PyPI' : 'npm'} package
                  </span>
                  <ExternalLink className="text-text-muted size-3.5" aria-hidden />
                </a>
              )}
              {server.homepageUrl && (
                <a
                  href={server.homepageUrl}
                  target="_blank"
                  rel="noreferrer noopener nofollow"
                  className="hover:bg-surface-hover flex min-h-10 items-center justify-between gap-2 rounded-md px-3 text-sm transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Globe className="text-text-muted size-4" aria-hidden />
                    Homepage
                  </span>
                  <ExternalLink className="text-text-muted size-3.5" aria-hidden />
                </a>
              )}
              <Link
                href={`/servers/${server.slug}/report`}
                className="text-text-muted hover:bg-surface-hover hover:text-foreground flex min-h-10 items-center gap-2 rounded-md px-3 text-sm transition-colors"
              >
                <Flag className="size-4" aria-hidden />
                Report this listing
              </Link>
            </CardContent>
          </Card>

          <BadgeCta
            slug={server.slug}
            name={server.name}
            trustTotal={server.trustTotal}
            siteUrl={SITE_URL}
          />
        </aside>
      </div>
    </main>
  );
}
