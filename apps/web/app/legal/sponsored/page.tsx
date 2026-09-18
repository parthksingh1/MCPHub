import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalPage } from '@/components/legal-page';

export const metadata: Metadata = {
  title: 'Sponsored content',
  description:
    'How MCPHub labels paid Spotlight placements, and why they can never affect Trust Scores or rankings.',
  alternates: { canonical: '/legal/sponsored' },
};

/** Sponsored content disclosure. */
export default function SponsoredPage(): React.JSX.Element {
  return (
    <LegalPage
      title="Sponsored content"
      path="/legal/sponsored"
      updated="2026-09-19"
      summary={
        <p>
          The only paid thing on MCPHub is the Spotlight strip. It is always marked
          &ldquo;Sponsored&rdquo;, it sits apart from rankings and search results, and paying for it
          changes nothing about a server&apos;s Trust Score, rank or security results.
        </p>
      }
      sections={[
        {
          id: 'what',
          title: 'What is sponsored',
          body: (
            <p>
              <Link href="/spotlight">Spotlight</Link> placements are paid slots for servers already
              in the index. They appear in a dedicated strip labelled &ldquo;Sponsored&rdquo; and on
              the Spotlight page. Nothing else on MCPHub is paid for: not listings, not scores, not
              rankings, not reviews, not search order.
            </p>
          ),
        },
        {
          id: 'labels',
          title: 'How sponsored content is labelled',
          body: (
            <ul>
              <li>Every placement carries a visible &ldquo;Sponsored&rdquo; label.</li>
              <li>
                Sponsored links use <code>rel=&quot;sponsored&quot;</code> for search engines.
              </li>
              <li>The server&apos;s real Trust Score is shown alongside, unchanged.</li>
            </ul>
          ),
        },
        {
          id: 'independence',
          title: 'Editorial independence',
          body: (
            <p>
              Trust Scores are computed by the open <Link href="/trust-score">methodology</Link>{' '}
              with no manual override for sponsors. Rankings are sorted by that score alone. A
              sponsor that later scores badly is shown with that score, and we will end a placement
              early — with a refund for the unused part — if a server turns out to be unsafe,
              deprecated or misleading.
            </p>
          ),
        },
        {
          id: 'eligibility',
          title: 'Who can sponsor',
          body: (
            <p>
              Only servers already indexed, not deprecated, and without unresolved critical scan
              findings. The buyer confirms they maintain the server or have permission. Full payment
              and refund terms are in the <Link href="/legal/terms#spotlight">Terms of use</Link>.
            </p>
          ),
        },
      ]}
    />
  );
}
