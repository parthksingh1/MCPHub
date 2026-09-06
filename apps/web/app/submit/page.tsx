import type { Metadata } from 'next';

import { SubmitForm } from '@/components/submit-form';

export const metadata: Metadata = {
  title: 'Submit an MCP server',
  description:
    'Add a Model Context Protocol server to the MCPHub directory. Indexed within 24 hours.',
  alternates: { canonical: '/submit' },
};

/** The submission page. */
export default function SubmitPage(): React.JSX.Element {
  return (
    <main className="container max-w-2xl py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Submit a server</h1>
      <p className="text-text-secondary mt-3 leading-relaxed">
        Built an MCP server, or found one that is missing? Paste the GitHub URL and we will index
        it, score it, and scan it — usually within 24 hours.
      </p>

      <SubmitForm className="mt-8" />

      <section className="mt-12 border-t pt-8">
        <h2 className="font-medium">What happens next</h2>
        <ol className="text-text-secondary mt-4 space-y-3 text-sm leading-relaxed">
          <li className="flex gap-3">
            <span className="text-text-muted font-mono text-xs">01</span>
            The nightly crawler picks up your submission and reads the repository&apos;s public
            metadata.
          </li>
          <li className="flex gap-3">
            <span className="text-text-muted font-mono text-xs">02</span>
            We extract the install commands, tools, and categories from the README, and compute a
            Trust Score.
          </li>
          <li className="flex gap-3">
            <span className="text-text-muted font-mono text-xs">03</span>
            The weekly security scan runs the MCP ruleset over the source and publishes any findings
            on the listing.
          </li>
        </ol>

        <p className="text-text-muted mt-6 text-sm leading-relaxed">
          We only index public repositories, and we only index actual MCP servers — clients, SDKs,
          and awesome-lists are filtered out automatically.
        </p>
      </section>
    </main>
  );
}
