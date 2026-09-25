import { getDatabase, servers, type ServerRow } from '@mcphub/db';
import { AWARD_THRESHOLDS } from '@mcphub/scoring';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  MCP_CLIENTS,
  type CategoryCount,
  type ServerQuery,
  type SiteStats,
} from '@mcphub/shared';
import {
  and,
  arrayOverlaps,
  asc,
  desc,
  eq,
  gt,
  gte,
  ilike,
  isNotNull,
  ne,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';

/**
 * Whether the latest scan is current and clean, computed in SQL so lists never
 * have to load full scan reports. Mirrors `isScanClean` in @mcphub/scoring
 * exactly: unscanned or stale is never clean.
 */
const scanCleanSql = sql<boolean>`coalesce(
    (${servers.security}->>'scanned')::boolean
    and (${servers.security}->>'lastScanAt')::timestamptz
      > now() - make_interval(days => ${AWARD_THRESHOLDS.scanMaxAgeDays})
    and not jsonb_path_exists(
      ${servers.security},
      '$.findings[*] ? (@.severity == "critical" || @.severity == "high")'
    )
    and coalesce((${servers.security}->'dependencyAudit'->>'critical')::int, 0)
      + coalesce((${servers.security}->'dependencyAudit'->>'high')::int, 0) = 0,
    false
  )`;

/** The column set returned for cards, lists, and search results. */
const summaryColumns = {
  id: servers.id,
  slug: servers.slug,
  name: servers.name,
  description: servers.description,
  authorName: servers.authorName,
  authorAvatar: servers.authorAvatar,
  isOfficial: servers.isOfficial,
  repoUrl: servers.repoUrl,
  categories: servers.categories,
  tags: servers.tags,
  language: servers.language,
  githubStars: servers.githubStars,
  lastCommitAt: servers.lastCommitAt,
  trustTotal: servers.trustTotal,
  trustPrevious: servers.trustPrevious,
  ratingAvg: servers.ratingAvg,
  ratingCount: servers.ratingCount,
  featured: servers.featured,
  verified: servers.verified,
  deprecated: servers.deprecated,
  updatedAt: servers.updatedAt,
  license: servers.license,
  scanClean: scanCleanSql.as('scan_clean'),
};

/** Columns in the summary that map straight onto table columns. */
type SummaryTableColumn = Exclude<keyof typeof summaryColumns, 'scanClean'>;

/** A server as rendered on a card. */
export type ServerSummaryRow = {
  [K in SummaryTableColumn]: ServerRow[K & keyof ServerRow];
} & { scanClean: boolean };

/** A page of servers plus the metadata the UI needs to paginate. */
export interface ServerPage {
  items: ServerSummaryRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Builds the WHERE clause for a browse query.
 *
 * Deprecated servers are excluded unconditionally. They stay in the database
 * so their detail pages keep working and keep their inbound links, but a
 * directory that surfaces dead servers in its default listing is not doing its
 * job.
 */
function buildFilters(query: ServerQuery): SQL | undefined {
  const conditions: (SQL | undefined)[] = [eq(servers.deprecated, false)];

  if (query.category?.length) {
    conditions.push(arrayOverlaps(servers.categories, query.category));
  }

  if (query.language) conditions.push(eq(servers.language, query.language));
  if (query.license) conditions.push(ilike(servers.license, query.license));
  if (query.minTrust !== undefined) conditions.push(gte(servers.trustTotal, query.minTrust));
  if (query.verified) conditions.push(eq(servers.verified, true));
  if (query.official) conditions.push(eq(servers.isOfficial, true));

  // Client compatibility lives in JSONB; a server matches if it supports any
  // of the requested clients.
  if (query.client?.length) {
    const clauses = query.client
      .filter((client) => MCP_CLIENTS.includes(client))
      .map((client) => sql`${servers.compatibleClients} ->> ${client} = 'true'`);

    if (clauses.length > 0) conditions.push(or(...clauses));
  }

  if (query.q) {
    // `websearch_to_tsquery` accepts what a person actually types — quoted
    // phrases, `or`, a leading minus — and never throws on malformed input,
    // unlike `to_tsquery`, which would turn a stray character into a 500.
    conditions.push(sql`${servers.searchVector} @@ websearch_to_tsquery('english', ${query.q})`);
  }

  return and(...conditions.filter((condition): condition is SQL => condition !== undefined));
}

/** Translates the sort option into an ORDER BY clause. */
function buildOrderBy(query: ServerQuery): SQL[] {
  // Relevance beats every other ordering when the user has typed something.
  if (query.q && query.sort === 'trust') {
    return [
      sql`ts_rank(${servers.searchVector}, websearch_to_tsquery('english', ${query.q})) DESC`,
      desc(servers.trustTotal),
    ];
  }

  switch (query.sort) {
    case 'stars':
      return [desc(servers.githubStars)];
    case 'recent':
      return [desc(servers.indexedAt)];
    case 'updated':
      return [desc(servers.lastCommitAt)];
    case 'name':
      return [asc(servers.name)];
    case 'rating':
      // Servers with no ratings sort last rather than tying at zero with
      // genuinely badly-rated ones.
      return [desc(sql`CASE WHEN ${servers.ratingCount} > 0 THEN ${servers.ratingAvg} END`)];
    default:
      return [desc(servers.trustTotal), desc(servers.githubStars)];
  }
}

/** Lists servers matching a browse query, with pagination metadata. */
export async function listServers(query: ServerQuery): Promise<ServerPage> {
  const db = getDatabase();
  const where = buildFilters(query);
  const offset = (query.page - 1) * query.pageSize;

  const [items, countResult] = await Promise.all([
    db
      .select(summaryColumns)
      .from(servers)
      .where(where)
      // `servers.id` breaks ties so pagination is stable: without it Postgres
      // may return the same row on two pages and drop another entirely.
      .orderBy(...buildOrderBy(query), asc(servers.id))
      .limit(query.pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(servers)
      .where(where),
  ]);

  const total = countResult[0]?.count ?? 0;

  return {
    items,
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.ceil(total / query.pageSize),
    hasMore: offset + items.length < total,
  };
}

/** Fetches one server by slug, including deprecated ones. */
export async function getServerBySlug(slug: string): Promise<ServerRow | null> {
  const db = getDatabase();

  const [row] = await db.select().from(servers).where(eq(servers.slug, slug)).limit(1);
  return row ?? null;
}

/**
 * Finds servers similar to a given one.
 *
 * Ranked by category overlap first, then Trust Score. Category overlap is a
 * far better similarity signal here than text similarity: two Postgres servers
 * are alternatives to each other even when their READMEs share no vocabulary.
 */
export async function getRelatedServers(
  serverId: string,
  categories: string[],
  limit = 6,
): Promise<ServerSummaryRow[]> {
  const db = getDatabase();

  if (categories.length === 0) {
    return db
      .select(summaryColumns)
      .from(servers)
      .where(and(eq(servers.deprecated, false), ne(servers.id, serverId)))
      .orderBy(desc(servers.trustTotal))
      .limit(limit);
  }

  // Built as an explicit `ARRAY[$1, $2, ...]::text[]` rather than binding the
  // JS array directly: Drizzle binds a bare array as a record, and Postgres
  // then refuses to cast a record to text[].
  const categoryArray = sql`ARRAY[${sql.join(
    categories.map((category) => sql`${category}`),
    sql`, `,
  )}]::text[]`;

  const overlap = sql<number>`cardinality(ARRAY(
    SELECT unnest(${servers.categories}) INTERSECT SELECT unnest(${categoryArray})
  ))`;

  return db
    .select(summaryColumns)
    .from(servers)
    .where(
      and(
        eq(servers.deprecated, false),
        ne(servers.id, serverId),
        arrayOverlaps(servers.categories, categories),
      ),
    )
    .orderBy(desc(overlap), desc(servers.trustTotal))
    .limit(limit);
}

/** Counts non-deprecated servers per category, for the browse sidebar. */
export async function getCategoryCounts(): Promise<CategoryCount[]> {
  const db = getDatabase();

  const rows = await db
    .select({
      category: sql<string>`unnest(${servers.categories})`.as('category'),
      count: sql<number>`count(*)::int`,
    })
    .from(servers)
    .where(eq(servers.deprecated, false))
    .groupBy(sql`1`);

  const counts = new Map(rows.map((row) => [row.category, row.count]));

  // Every category is returned, including empty ones, so the filter UI does
  // not reflow as the catalogue grows.
  return CATEGORIES.map((slug) => ({
    slug,
    label: CATEGORY_LABELS[slug],
    count: counts.get(slug) ?? 0,
  }));
}

/** Aggregate figures for the homepage stats bar. */
export async function getSiteStats(): Promise<SiteStats> {
  const db = getDatabase();

  // Two statements rather than one join. Joining against `unnest(categories)`
  // multiplies each server by its category count, so a single `count(*)` over
  // the join reports server-category pairs — 1,137 rather than 455. Counting
  // distinct ids would fix the number but still scan the exploded set for no
  // benefit, so the category count gets its own cheap query instead.
  const [totals, categories] = await Promise.all([
    db
      .select({
        totalServers: sql<number>`count(*)::int`,
        verifiedServers: sql<number>`count(*) FILTER (WHERE ${servers.verified})::int`,
        lastIndexedAt: sql<Date | null>`max(${servers.indexedAt})`,
      })
      .from(servers)
      .where(eq(servers.deprecated, false)),
    db
      .select({ total: sql<number>`count(DISTINCT c)::int` })
      .from(sql`${servers}, unnest(${servers.categories}) AS c`)
      .where(eq(servers.deprecated, false)),
  ]);

  const row = totals[0];

  return {
    totalServers: row?.totalServers ?? 0,
    verifiedServers: row?.verifiedServers ?? 0,
    totalCategories: categories[0]?.total ?? 0,
    totalClients: MCP_CLIENTS.length,
    lastIndexedAt: row?.lastIndexedAt ? new Date(row.lastIndexedAt).toISOString() : null,
  };
}

/** Fast typeahead search, used by the command palette. */
export async function searchServers(term: string, limit: number): Promise<ServerSummaryRow[]> {
  const db = getDatabase();

  return db
    .select(summaryColumns)
    .from(servers)
    .where(
      and(
        eq(servers.deprecated, false),
        or(
          sql`${servers.searchVector} @@ websearch_to_tsquery('english', ${term})`,
          // A prefix match on the name catches what full-text search misses:
          // someone typing "post" has not finished the word yet, and the
          // stemmer has nothing to match on until they do.
          ilike(servers.name, `${term}%`),
        ),
      ),
    )
    .orderBy(
      desc(sql`ts_rank(${servers.searchVector}, websearch_to_tsquery('english', ${term}))`),
      desc(servers.trustTotal),
    )
    .limit(limit);
}

/** The featured servers shown on the homepage. */
export async function getFeaturedServers(limit = 6): Promise<ServerSummaryRow[]> {
  const db = getDatabase();

  return db
    .select(summaryColumns)
    .from(servers)
    .where(and(eq(servers.deprecated, false), eq(servers.featured, true)))
    .orderBy(desc(servers.trustTotal))
    .limit(limit);
}

/**
 * Highest-trust servers, used as the homepage fallback before anything has
 * been hand-picked. A brand-new deployment should not show an empty homepage.
 */
export async function getTopServers(limit = 6): Promise<ServerSummaryRow[]> {
  const db = getDatabase();

  return db
    .select(summaryColumns)
    .from(servers)
    .where(eq(servers.deprecated, false))
    .orderBy(desc(servers.trustTotal), desc(servers.githubStars))
    .limit(limit);
}

/**
 * Servers whose Trust Score moved up the most recently.
 *
 * Movement is what makes a leaderboard worth revisiting — a static ranking is
 * checked once. Restricted to genuine rises within the window: a server that
 * dropped is not something to celebrate on the homepage, and one whose score
 * has never moved has no story to tell.
 */
export async function getTrendingServers(limit = 6, withinDays = 7): Promise<ServerSummaryRow[]> {
  const db = getDatabase();
  const since = new Date(Date.now() - withinDays * 86_400_000);

  const delta = sql<number>`(${servers.trustTotal} - ${servers.trustPrevious})`;

  return db
    .select(summaryColumns)
    .from(servers)
    .where(
      and(
        eq(servers.deprecated, false),
        isNotNull(servers.trustPrevious),
        gte(servers.trustPreviousAt, since),
        gt(delta, 0),
      ),
    )
    .orderBy(desc(delta), desc(servers.trustTotal))
    .limit(limit);
}

/** Most recently indexed servers, for the "recently added" section. */
export async function getRecentServers(limit = 6): Promise<ServerSummaryRow[]> {
  const db = getDatabase();

  return db
    .select(summaryColumns)
    .from(servers)
    .where(eq(servers.deprecated, false))
    .orderBy(desc(servers.indexedAt))
    .limit(limit);
}

/** Every slug, for sitemap generation and static params. */
export async function getAllSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
  const db = getDatabase();

  return db
    .select({ slug: servers.slug, updatedAt: servers.updatedAt })
    .from(servers)
    .where(eq(servers.deprecated, false));
}

/**
 * Servers that currently hold the MCPHub Trusted badge, best first.
 *
 * The same rule as `computeAwards` in @mcphub/scoring, expressed in SQL so the
 * database does the filtering: score, a current clean scan, recent activity,
 * a declared licence, and not deprecated.
 */
export async function getTrustedServers(limit = 6): Promise<ServerSummaryRow[]> {
  const db = getDatabase();

  return db
    .select(summaryColumns)
    .from(servers)
    .where(
      and(
        eq(servers.deprecated, false),
        gte(servers.trustTotal, AWARD_THRESHOLDS.trustedMinScore),
        scanCleanSql,
        gte(
          servers.lastCommitAt,
          new Date(Date.now() - AWARD_THRESHOLDS.trustedMaxCommitAgeDays * 86_400_000),
        ),
        isNotNull(servers.license),
        ne(servers.license, ''),
      ),
    )
    .orderBy(desc(servers.trustTotal), desc(servers.githubStars))
    .limit(limit);
}
