import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ReportForm } from '@/components/report-form';
import { getServerBySlug } from '@/lib/queries/servers';

export const dynamic = 'force-dynamic';

/** Route params for a single server. */
interface PageProps {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: 'Report a server',
  robots: { index: false, follow: false },
};

/** The report page, linked from every server detail page. */
export default async function ReportPage({ params }: PageProps): Promise<React.JSX.Element> {
  const { slug } = await params;
  const server = await getServerBySlug(slug);

  if (!server) notFound();

  return (
    <main className="container max-w-2xl py-12">
      <nav aria-label="Breadcrumb" className="text-text-muted text-sm">
        <Link href="/servers" className="hover:text-foreground transition-colors">
          Servers
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <Link href={`/servers/${server.slug}`} className="hover:text-foreground transition-colors">
          {server.name}
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-text-secondary">Report</span>
      </nav>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Report {server.name}</h1>
      <p className="text-text-secondary mt-3 leading-relaxed">
        Tell us what is wrong with this listing. Reports are private — only MCPHub maintainers can
        read them, and we review every one.
      </p>

      <ReportForm slug={server.slug} className="mt-8" />

      <p className="text-text-muted mt-10 border-t pt-6 text-sm leading-relaxed">
        Found a security vulnerability in the server itself? Report it to that project&apos;s
        maintainers first, then let us know here so we can flag the listing while it is fixed. See
        our{' '}
        <Link href="/security" className="text-accent underline underline-offset-2">
          security policy
        </Link>{' '}
        for how we handle disclosures.
      </p>
    </main>
  );
}
