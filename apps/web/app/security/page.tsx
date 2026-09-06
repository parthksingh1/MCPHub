import type { Metadata } from 'next';
import Link from 'next/link';

import { SECURITY_ADVISORY_URL, SECURITY_CONTACT } from '@/lib/site';

export const revalidate = 86_400;

export const metadata: Metadata = {
  title: 'Security policy',
  description:
    'How MCPHub scans indexed servers, what the scan does and does not cover, and how to report a vulnerability.',
  alternates: { canonical: '/security' },
};

/** The public security policy. */
export default function SecurityPage(): React.JSX.Element {
  return (
    <main className="container max-w-prose py-12">
      <p className="eyebrow">Policy</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Security</h1>

      <p className="text-text-secondary mt-5 text-lg leading-relaxed">
        MCPHub exists because an MCP server is not an ordinary dependency. It runs on your machine,
        with your permissions, acting on instructions that may ultimately come from text a model
        read somewhere. This page says exactly what we check, and what we cannot.
      </p>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight">What we scan for</h2>
        <p className="text-text-secondary mt-3 text-sm leading-relaxed">
          Every indexed repository is shallow-cloned weekly and run through a Semgrep ruleset
          written specifically for the MCP threat model, plus a dependency audit. The rules are in
          the repository and you can read them.
        </p>

        <ul className="text-text-secondary mt-5 space-y-3 text-sm leading-relaxed">
          {[
            [
              'Command injection',
              'exec or spawn with an interpolated value, shell: true, subprocess with shell=True. In an MCP server the argument may originate from model output, which makes this remote code execution rather than a code smell.',
            ],
            [
              'Dynamic evaluation',
              'eval, new Function, dynamic require, pickle.loads. There is no safe way to use these on a value derived from a tool argument.',
            ],
            [
              'Path traversal',
              'Filesystem writes built by concatenation, and path.join used where path.resolve plus a root check is needed.',
            ],
            [
              'Hardcoded credentials',
              'Recognised provider token formats and generic secret assignments. Anything in a public repository must be treated as disclosed.',
            ],
            ['Network exposure', 'CORS open to every origin, and disabled TLS verification.'],
            [
              'Missing input validation',
              'Tools registered without a schema, so arguments reach the handler unchecked.',
            ],
          ].map(([title, detail]) => (
            <li key={title}>
              <strong className="text-foreground font-medium">{title}.</strong> {detail}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight">What the scan does not tell you</h2>
        <div className="text-text-secondary mt-3 space-y-4 text-sm leading-relaxed">
          <p>
            <strong className="text-foreground">A clean scan is not a safety guarantee.</strong>{' '}
            Static analysis finds patterns it was taught to find. It cannot reason about intent, and
            it cannot detect a server that behaves correctly until a particular input arrives.
          </p>
          <p>
            <strong className="text-foreground">An unscanned server is not a clean server.</strong>{' '}
            Newly indexed servers keep full security points until the weekly scan reaches them.
            Every server page states plainly whether it has been scanned. Read that before you read
            the number.
          </p>
          <p>
            <strong className="text-foreground">We do not audit behaviour.</strong> We do not run
            these servers, inspect their network traffic, or verify that a published package matches
            the repository it claims to come from.
          </p>
          <p>
            Read the source of anything you install, and give it the narrowest credentials that let
            it do its job.
          </p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight">Reporting a vulnerability</h2>

        <h3 className="mt-5 font-medium">In a listed server</h3>
        <p className="text-text-secondary mt-2 text-sm leading-relaxed">
          Report it to that project&apos;s maintainers first — they can fix it, we cannot. Then use
          the <strong className="text-foreground">Report</strong> link on its MCPHub page so we can
          flag the listing while it is being fixed. We do not publish details of an unfixed
          vulnerability.
        </p>

        <h3 className="mt-6 font-medium">In MCPHub itself</h3>
        <p className="text-text-secondary mt-2 text-sm leading-relaxed">
          Open a{' '}
          <a
            href={SECURITY_ADVISORY_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="text-accent underline underline-offset-2"
          >
            private security advisory on GitHub
          </a>
          {SECURITY_CONTACT ? (
            <>
              , or email{' '}
              <a
                href={`mailto:${SECURITY_CONTACT}`}
                className="text-accent underline underline-offset-2"
              >
                {SECURITY_CONTACT}
              </a>
            </>
          ) : null}
          . Please do not open a public issue for an unfixed vulnerability. We aim to acknowledge
          within 72 hours.
        </p>
      </section>

      <section className="mt-12 border-t pt-8">
        <h2 className="text-xl font-semibold tracking-tight">How MCPHub protects your data</h2>
        <p className="text-text-secondary mt-3 text-sm leading-relaxed">
          Authorisation is enforced by Postgres row-level security rather than by checks in
          application code, so a forgotten check cannot leak data. Reports are write-only for
          ordinary users — a reporter cannot read the reports table, and so cannot enumerate other
          people&apos;s reports. We store no passwords: sign-in is GitHub OAuth.
        </p>

        <Link
          href="/trust-score"
          className="text-accent mt-6 inline-block text-sm transition-opacity hover:opacity-80"
        >
          How the Trust Score uses these findings →
        </Link>
      </section>
    </main>
  );
}
