import { CATEGORY_LABELS, type Category } from '@mcphub/shared';
import type { Metadata } from 'next';
import Link from 'next/link';

import { TrustScoreRing } from '@/components/trust-score-ring';
import { Button } from '@/components/ui/button';
import { formatCount, formatLicense, formatRelativeTime } from '@/lib/format';
import { getServerBySlug } from '@/lib/queries/servers';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Compare MCP servers',
  description:
    'Put two Model Context Protocol servers side by side and compare their Trust Scores.',
  alternates: { canonical: '/compare' },
};

/** Next 15 passes search params as a promise. */
interface PageProps {
  searchParams: Promise<{ a?: string; b?: string }>;
}

/** One row of the comparison table. */
interface Row {
  label: string;
  a: string;
  b: string;
}

/** Side-by-side comparison of two servers. */
export default async function ComparePage({ searchParams }: PageProps): Promise<React.JSX.Element> {
  const { a, b } = await searchParams;

  const [left, right] = await Promise.all([
    a ? getServerBySlug(a) : Promise.resolve(null),
    b ? getServerBySlug(b) : Promise.resolve(null),
  ]);

  if (!left || !right) {
    return (
      <main className="container max-w-2xl py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Compare servers</h1>
        <p className="text-text-secondary mt-3 leading-relaxed">
          Put two servers side by side. Add{' '}
          <code className="font-mono text-sm">?a=slug&amp;b=slug</code> to the URL, or open any
          server and pick one from its Alternatives.
        </p>
        {(a ?? b) && (
          <p className="text-danger mt-4 text-sm">
            {!left && a ? `No server found with slug “${a}”. ` : ''}
            {!right && b ? `No server found with slug “${b}”.` : ''}
          </p>
        )}
        <Button asChild className="mt-6">
          <Link href="/servers">Browse servers</Link>
        </Button>
      </main>
    );
  }

  const rows: Row[] = [
    { label: 'Trust Score', a: `${left.trustTotal}/100`, b: `${right.trustTotal}/100` },
    { label: 'Maintenance', a: `${left.trustMaintenance}/25`, b: `${right.trustMaintenance}/25` },
    { label: 'Popularity', a: `${left.trustPopularity}/25`, b: `${right.trustPopularity}/25` },
    { label: 'Security', a: `${left.trustSecurity}/25`, b: `${right.trustSecurity}/25` },
    { label: 'Quality', a: `${left.trustQuality}/25`, b: `${right.trustQuality}/25` },
    { label: 'Stars', a: formatCount(left.githubStars), b: formatCount(right.githubStars) },
    { label: 'Language', a: left.language ?? '—', b: right.language ?? '—' },
    {
      label: 'Licence',
      a: formatLicense(left.license) ?? 'Unknown',
      b: formatLicense(right.license) ?? 'Unknown',
    },
    {
      label: 'Last commit',
      a: formatRelativeTime(left.lastCommitAt),
      b: formatRelativeTime(right.lastCommitAt),
    },
    {
      label: 'Tools',
      a: String(left.capabilities?.tools?.length ?? 0),
      b: String(right.capabilities?.tools?.length ?? 0),
    },
    {
      label: 'Transport',
      a: left.transport.join(', ') || '—',
      b: right.transport.join(', ') || '—',
    },
    {
      label: 'Categories',
      a: left.categories.map((c) => CATEGORY_LABELS[c as Category] ?? c).join(', '),
      b: right.categories.map((c) => CATEGORY_LABELS[c as Category] ?? c).join(', '),
    },
  ];

  return (
    <main className="container py-10">
      <h1 className="text-3xl font-semibold tracking-tight">
        {left.name} vs {right.name}
      </h1>

      <div className="mt-8 grid grid-cols-2 gap-4">
        {[left, right].map((server) => (
          <Link
            key={server.id}
            href={`/servers/${server.slug}`}
            className="bg-surface hover:border-hover flex flex-col items-center gap-3 rounded-lg border p-6 text-center transition-colors"
          >
            <TrustScoreRing score={server.trustTotal} size={64} strokeWidth={4} showLabel />
            <span className="font-medium">{server.name}</span>
            <span className="text-text-muted line-clamp-2 text-xs">{server.description}</span>
          </Link>
        ))}
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">
            Feature comparison between {left.name} and {right.name}
          </caption>
          <thead>
            <tr className="border-b">
              <th
                scope="col"
                className="text-text-muted py-2 text-left text-xs font-medium uppercase"
              >
                Metric
              </th>
              <th scope="col" className="py-2 text-left font-medium">
                {left.name}
              </th>
              <th scope="col" className="py-2 text-left font-medium">
                {right.name}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              // Emphasis only where the values differ, so the eye lands on what
              // actually distinguishes the two servers.
              const differs = row.a !== row.b;

              return (
                <tr key={row.label} className="border-b last:border-0">
                  <th scope="row" className="text-text-muted py-2.5 pr-4 text-left font-normal">
                    {row.label}
                  </th>
                  <td
                    className={
                      differs ? 'py-2.5 pr-4 font-medium' : 'text-text-secondary py-2.5 pr-4'
                    }
                  >
                    {row.a}
                  </td>
                  <td className={differs ? 'py-2.5 font-medium' : 'text-text-secondary py-2.5'}>
                    {row.b}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
