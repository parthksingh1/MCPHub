import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalPage } from '@/components/legal-page';
import { CONTACT_EMAIL, REPO_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'What MCPHub collects, why, who processes it, and how to get it deleted.',
  alternates: { canonical: '/legal/privacy' },
};

/** How to reach the operator about personal data. */
function Contact(): React.JSX.Element {
  return CONTACT_EMAIL ? (
    <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
  ) : (
    <a href={`${REPO_URL}/issues/new`} target="_blank" rel="noreferrer noopener">
      a GitHub issue
    </a>
  );
}

/** Privacy policy. Describes only what the code actually does. */
export default function PrivacyPage(): React.JSX.Element {
  return (
    <LegalPage
      title="Privacy policy"
      path="/legal/privacy"
      updated="2026-09-19"
      summary={
        <p>
          You can browse MCPHub without an account, and we don&apos;t use analytics, advertising
          trackers, or third-party cookies. If you sign in with GitHub we keep your public GitHub
          profile and the things you do on the site — favourites, ratings, reviews, reports and
          submissions — so those features work. We never sell data. You can delete your account and
          everything attached to it at any time.
        </p>
      }
      sections={[
        {
          id: 'who',
          title: 'Who we are',
          body: (
            <p>
              MCPHub is an independent, open-source directory of Model Context Protocol servers, run
              by Parth Kumar Singh. The full source code is public at{' '}
              <a href={REPO_URL} target="_blank" rel="noreferrer noopener">
                {REPO_URL.replace('https://', '')}
              </a>
              , so every claim in this policy can be checked against the code. For privacy
              questions, contact us via <Contact />.
            </p>
          ),
        },
        {
          id: 'browsing',
          title: 'When you just browse',
          body: (
            <>
              <p>No account, no cookies set by us, no analytics. We do process:</p>
              <ul>
                <li>
                  <strong>Your IP address</strong>, briefly, to rate-limit the API and prevent
                  abuse. It is held as a short-lived counter in our cache (minutes, not days) and is
                  not linked to anything else.
                </li>
                <li>
                  <strong>Standard request logs</strong> kept by our hosting provider (URL, time,
                  user agent, IP) for security and debugging, under their own retention.
                </li>
                <li>
                  <strong>Your theme preference</strong>, stored in your own browser&apos;s local
                  storage. It never leaves your device.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: 'account',
          title: 'When you sign in',
          body: (
            <>
              <p>
                Sign-in is through GitHub. We receive your GitHub username, display name, avatar
                URL, public email address and GitHub user ID. We never see your GitHub password, and
                we request no access to your repositories.
              </p>
              <p>We then store what you choose to create:</p>
              <ul>
                <li>favourites (which servers you saved);</li>
                <li>ratings and review text — ratings and reviews are shown publicly;</li>
                <li>reports you file about a listing;</li>
                <li>servers you submit for indexing.</li>
              </ul>
              <p>
                A session cookie keeps you signed in. It is strictly necessary for sign-in and is
                not used for tracking.
              </p>
            </>
          ),
        },
        {
          id: 'maintainers',
          title: 'Data about listed projects and maintainers',
          body: (
            <>
              <p>
                Listings are built from public data: GitHub repository metadata (name, description,
                README, stars, licence, commit activity, owner username and avatar) and public
                package-registry data (npm, PyPI). We process it on the basis of legitimate interest
                — helping developers choose safe, well-maintained software — and show only what the
                project already publishes.
              </p>
              <p>
                Maintainers can correct or remove a listing at any time; see{' '}
                <Link href="/legal/removal">Listing removal</Link>.
              </p>
            </>
          ),
        },
        {
          id: 'payments',
          title: 'Payments',
          body: (
            <p>
              If you buy a <Link href="/spotlight">Spotlight</Link> placement, payment is handled
              entirely by Stripe. Your card details go straight to Stripe and never reach our
              servers. We keep the placement record — which server, which dates, the amount, and the
              email Stripe gives us for the receipt — as long as tax and accounting rules require.
            </p>
          ),
        },
        {
          id: 'processors',
          title: 'Who processes data for us',
          body: (
            <>
              <p>We use a small number of infrastructure providers, each only for its purpose:</p>
              <ul>
                <li>
                  <strong>Supabase</strong> — database and GitHub sign-in.
                </li>
                <li>
                  <strong>Vercel</strong> — web hosting and request logs.
                </li>
                <li>
                  <strong>Upstash</strong> — cache and rate-limit counters.
                </li>
                <li>
                  <strong>Cloudflare</strong> — DNS and network protection.
                </li>
                <li>
                  <strong>GitHub</strong> — sign-in and public repository data.
                </li>
                <li>
                  <strong>Stripe</strong> — Spotlight payments only.
                </li>
              </ul>
              <p>
                Some of these providers operate outside your country. We rely on their standard
                data-protection terms for those transfers.
              </p>
            </>
          ),
        },
        {
          id: 'retention',
          title: 'How long we keep it',
          body: (
            <ul>
              <li>Account data: until you delete your account.</li>
              <li>Rate-limit counters: minutes.</li>
              <li>
                Reports and submissions: kept after account deletion, with your identity removed.
              </li>
              <li>Payment records: as long as tax law requires.</li>
            </ul>
          ),
        },
        {
          id: 'rights',
          title: 'Your rights',
          body: (
            <>
              <p>
                Depending on where you live (for example under the GDPR, UK GDPR, CCPA or
                India&apos;s DPDP Act), you can ask to access, correct, export or delete your
                personal data, or object to how we use it. Deleting your account from the dashboard
                removes your profile, favourites, ratings and reviews immediately.
              </p>
              <p>
                For anything else, contact us via <Contact />. We aim to respond within 30 days. You
                can also complain to your local data-protection authority.
              </p>
            </>
          ),
        },
        {
          id: 'children',
          title: 'Children',
          body: (
            <p>
              MCPHub is a developer tool and is not directed at children. Accounts are for people
              aged 16 or older, or the minimum age for a GitHub account where you live, whichever is
              higher.
            </p>
          ),
        },
        {
          id: 'changes',
          title: 'Changes',
          body: (
            <p>
              When this policy changes, we update the date at the top. Every past version is in the
              project&apos;s public git history.
            </p>
          ),
        },
      ]}
    />
  );
}
