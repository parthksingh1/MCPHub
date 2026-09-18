import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalPage } from '@/components/legal-page';
import { CONTACT_EMAIL, REMOVAL_REQUEST_URL, SECURITY_ADVISORY_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Listing removal and corrections',
  description:
    'Maintainers can correct, claim, or remove their MCP server listing on MCPHub. Here is how, and how fast.',
  alternates: { canonical: '/legal/removal' },
};

/** Listing removal / takedown process. */
export default function RemovalPage(): React.JSX.Element {
  return (
    <LegalPage
      title="Listing removal"
      path="/legal/removal"
      updated="2026-09-19"
      summary={
        <p>
          If you maintain a listed server and want it corrected or removed, just ask — you
          don&apos;t need to give a reason. We act on removal requests from maintainers within 7
          days, usually much sooner, and stop re-indexing the project afterwards.
        </p>
      }
      sections={[
        {
          id: 'why-listed',
          title: 'Why your project is listed',
          body: (
            <p>
              MCPHub indexes public MCP server repositories and packages automatically so developers
              can compare them in one place. Listing is not an endorsement, and we show only what
              the project already publishes: README, metadata and public activity. We never claim an
              affiliation that doesn&apos;t exist.
            </p>
          ),
        },
        {
          id: 'options',
          title: 'What you can ask for',
          body: (
            <ul>
              <li>
                <strong>Correction</strong> — wrong description, category, install command, or a
                scan result you believe is a false positive.
              </li>
              <li>
                <strong>Mark as deprecated</strong> — keep the page, point people elsewhere.
              </li>
              <li>
                <strong>Removal</strong> — take the listing down and exclude the repository from
                future crawls.
              </li>
              <li>
                <strong>Remove a review</strong> that breaks our{' '}
                <Link href="/legal/terms#accounts">content rules</Link>.
              </li>
            </ul>
          ),
        },
        {
          id: 'how',
          title: 'How to request it',
          body: (
            <>
              <ol>
                <li>
                  Open a{' '}
                  <a href={REMOVAL_REQUEST_URL} target="_blank" rel="noreferrer noopener">
                    removal or correction request
                  </a>{' '}
                  on GitHub, signed in as a user with write access to the repository — that is how
                  we verify you speak for the project.
                </li>
                <li>Tell us the MCPHub page URL and what you want changed.</li>
              </ol>
              {CONTACT_EMAIL && (
                <p>
                  Prefer not to post publicly? Email{' '}
                  <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> from an address we can
                  link to the project.
                </p>
              )}
              <p>
                Found a security vulnerability in MCPHub itself? Please use a{' '}
                <a href={SECURITY_ADVISORY_URL} target="_blank" rel="noreferrer noopener">
                  private security advisory
                </a>{' '}
                instead.
              </p>
            </>
          ),
        },
        {
          id: 'timeline',
          title: 'What happens next',
          body: (
            <ul>
              <li>We acknowledge requests within 3 days.</li>
              <li>Verified removals are done within 7 days, usually much sooner.</li>
              <li>
                Removed projects are added to a crawler exclusion list, so they do not come back on
                the next crawl.
              </li>
              <li>Search engines may show a cached copy for a while after removal.</li>
            </ul>
          ),
        },
        {
          id: 'copyright',
          title: 'Copyright and trademark complaints',
          body: (
            <p>
              If you believe content on MCPHub infringes your copyright or trademark and you are not
              the project maintainer, file a request with your contact details, the material
              concerned, the right you hold, and a statement that you believe in good faith the use
              is not authorised. We will review it and, where appropriate, remove the content and
              let the other party respond.
            </p>
          ),
        },
      ]}
    />
  );
}
