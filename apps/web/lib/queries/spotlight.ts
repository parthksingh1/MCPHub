import { getDatabase, servers, sponsorships } from '@mcphub/db';
import { and, desc, eq, gt, max, sql, sum } from 'drizzle-orm';

/** One sponsored server, with its combined active bid. */
export interface SponsorRow {
  slug: string;
  name: string;
  description: string;
  authorAvatar: string | null;
  trustTotal: number;
  /** Sum of every active purchase for this server, in cents. */
  totalCents: number;
  /** When the last of those purchases ends. */
  endsAt: Date;
}

/**
 * Active sponsors, highest combined bid first.
 *
 * Purchases for the same server add up, so a sponsor who is outbid can top up
 * rather than start over. Deprecated servers drop out immediately even if a
 * placement is still paid — the refund terms cover that case.
 */
export async function getActiveSponsors(): Promise<SponsorRow[]> {
  const db = getDatabase();

  const total = sql<number>`${sum(sponsorships.amountCents)}::int`;

  const rows = await db
    .select({
      slug: servers.slug,
      name: servers.name,
      description: servers.description,
      authorAvatar: servers.authorAvatar,
      trustTotal: servers.trustTotal,
      totalCents: total,
      endsAt: max(sponsorships.endsAt),
    })
    .from(sponsorships)
    .innerJoin(servers, eq(sponsorships.serverId, servers.id))
    .where(
      and(
        eq(sponsorships.status, 'active'),
        gt(sponsorships.endsAt, sql`now()`),
        eq(servers.deprecated, false),
      ),
    )
    .groupBy(servers.id)
    .orderBy(desc(total), servers.name);

  return rows.flatMap((row) => (row.endsAt ? [{ ...row, endsAt: row.endsAt }] : []));
}
