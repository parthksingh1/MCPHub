import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalPage } from '@/components/legal-page';
import { CONTACT_EMAIL, REPO_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Terms of use',
  description:
    'The rules for using MCPHub: what the Trust Score is and is not, your content, Spotlight payments, and liability.',
  alternates: { canonical: '/legal/terms' },
};

/** Terms of use. */
export default function TermsPage(): React.JSX.Element {
  return (
    <LegalPage
      title="Terms of use"
      path="/legal/terms"
      updated="2026-09-19"
      summary={
        <p>
          MCPHub is a free directory of third-party software. We don&apos;t make, host or run the
          servers listed here, and a Trust Score is an automated signal, not a guarantee or an
          endorsement — always review code before you give it access to your systems. Be decent in
          reviews. Spotlight placements are paid ads, clearly labelled, and never change scores or
          rankings.
        </p>
      }
      sections={[
        {
          id: 'service',
          title: 'The service',
          body: (
            <p>
              MCPHub (&ldquo;we&rdquo;) indexes publicly available Model Context Protocol servers
              and shows information about them. By using the site or API you agree to these terms.
              If you don&apos;t agree, please don&apos;t use MCPHub.
            </p>
          ),
        },
        {
          id: 'third-party',
          title: 'Listed servers are third-party software',
          body: (
            <>
              <p>
                Every server listed belongs to its own authors and is governed by its own licence.
                We do not write, host, operate, audit by hand or distribute them, and we are not
                affiliated with their authors unless a listing says so.
              </p>
              <p>
                Installing an MCP server can give software access to your files, accounts and data.{' '}
                <strong>You are responsible for reviewing and choosing what you install.</strong>
              </p>
            </>
          ),
        },
        {
          id: 'trust-score',
          title: 'What the Trust Score is — and is not',
          body: (
            <>
              <p>
                The Trust Score and security scan results are generated automatically from public
                signals using the open <Link href="/trust-score">methodology</Link>. They are
                opinions about observable signals, provided for information only. They are not a
                security audit, a certification, or a statement that software is safe, and they can
                be wrong or out of date.
              </p>
              <p>
                Scores and rankings are never sold and cannot be influenced by payment. A low score
                is not an accusation of wrongdoing against any maintainer.
              </p>
            </>
          ),
        },
        {
          id: 'accounts',
          title: 'Accounts and your content',
          body: (
            <>
              <p>
                You sign in with GitHub and are responsible for activity on your account. You keep
                ownership of reviews and other content you post, and grant us a non-exclusive,
                worldwide, royalty-free licence to display it on MCPHub and through its API.
              </p>
              <p>Don&apos;t post content that is:</p>
              <ul>
                <li>false or misleading about a project, or written about your own project;</li>
                <li>abusive, harassing, discriminatory, or a personal attack on a maintainer;</li>
                <li>spam, advertising, or an attempt to manipulate ratings;</li>
                <li>someone else&apos;s private information, or unlawful.</li>
              </ul>
              <p>
                We may remove content or suspend accounts that break these rules. You can delete
                your account at any time from your dashboard.
              </p>
            </>
          ),
        },
        {
          id: 'acceptable-use',
          title: 'Acceptable use',
          body: (
            <ul>
              <li>Respect the published API rate limits; don&apos;t try to get around them.</li>
              <li>
                Don&apos;t probe, attack or disrupt the service. Report security issues via{' '}
                <Link href="/security">our security page</Link> instead.
              </li>
              <li>
                You may reuse listing data through the API with attribution to MCPHub. The code is
                MIT-licensed; see the{' '}
                <a href={REPO_URL} target="_blank" rel="noreferrer noopener">
                  repository
                </a>
                .
              </li>
            </ul>
          ),
        },
        {
          id: 'spotlight',
          title: 'Spotlight placements',
          body: (
            <>
              <p>
                <Link href="/spotlight">Spotlight</Link> lets anyone pay for a labelled sponsored
                slot for a server already in the index. By buying one you confirm you are the
                maintainer or have their permission.
              </p>
              <ul>
                <li>
                  Spotlight is advertising. It never affects Trust Scores, rankings or search.
                </li>
                <li>
                  We may decline or remove any placement — for example a deprecated, misleading or
                  unsafe listing — and refund the unused portion.
                </li>
                <li>
                  If a placement you paid for doesn&apos;t run, you get a full refund. Once a
                  placement has started it is otherwise non-refundable, except where the law says
                  otherwise.
                </li>
                <li>
                  Payments are processed by Razorpay under Razorpay&apos;s terms, in US dollars or
                  Indian rupees. Bids are ranked by their US-dollar value.
                </li>
              </ul>
              <p>
                See <Link href="/legal/sponsored">Sponsored content</Link> for how placements are
                shown.
              </p>
            </>
          ),
        },
        {
          id: 'ip',
          title: 'Names, logos and removal',
          body: (
            <p>
              Project names, logos and trademarks belong to their owners and are shown only to
              identify the projects. Owners can ask us to correct or remove a listing; see{' '}
              <Link href="/legal/removal">Listing removal</Link>.
            </p>
          ),
        },
        {
          id: 'warranty',
          title: 'No warranty',
          body: (
            <p>
              MCPHub is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without
              warranties of any kind, including accuracy, fitness for a particular purpose, and
              non-infringement. We don&apos;t promise the service will be uninterrupted or
              error-free.
            </p>
          ),
        },
        {
          id: 'liability',
          title: 'Limitation of liability',
          body: (
            <p>
              To the extent the law allows, we are not liable for any indirect, incidental or
              consequential loss, or for any loss caused by software you found through MCPHub. Our
              total liability for any claim is limited to the amount you paid us in the 12 months
              before it arose, or USD 50 if you paid nothing. Nothing here limits liability that
              cannot be limited by law.
            </p>
          ),
        },
        {
          id: 'changes',
          title: 'Changes and contact',
          body: (
            <p>
              We may update these terms; the date at the top shows the latest version, and every
              past version is in the public git history. Continuing to use MCPHub after a change
              means you accept it. Questions:{' '}
              {CONTACT_EMAIL ? (
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              ) : (
                <a href={`${REPO_URL}/issues/new`} target="_blank" rel="noreferrer noopener">
                  open a GitHub issue
                </a>
              )}
              .
            </p>
          ),
        },
      ]}
    />
  );
}
