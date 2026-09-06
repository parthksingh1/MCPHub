import { MAX_PAGE_SIZE, RATE_LIMITS } from '@mcphub/shared';
import type { Metadata } from 'next';
import Link from 'next/link';

import { SITE_URL } from '@/lib/site';

export const revalidate = 86_400;

export const metadata: Metadata = {
  title: 'API documentation',
  description:
    'The public MCPHub API: list, search, and inspect indexed Model Context Protocol servers. No key required.',
  alternates: { canonical: '/docs/api' },
};

/** One documented endpoint. */
interface Endpoint {
  method: 'GET' | 'POST';
  path: string;
  summary: string;
  params?: [string, string][];
  auth?: boolean;
}

const PUBLIC_ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: '/api/servers',
    summary: 'List servers with filtering, sorting, and pagination.',
    params: [
      ['q', 'Full-text search across name, description, and tags.'],
      ['category', 'Repeatable or comma-separated. e.g. database,devtools'],
      ['client', 'Filter by client compatibility. e.g. claudeDesktop'],
      ['language', 'typescript · python · go · rust · …'],
      ['minTrust', 'Minimum Trust Score, 0–100.'],
      ['verified', 'true to return only verified servers.'],
      ['official', 'true to return only first-party publishers.'],
      ['sort', 'trust · stars · recent · updated · rating · name'],
      ['page', 'Page number, from 1.'],
      ['pageSize', `Results per page. Max ${MAX_PAGE_SIZE}.`],
    ],
  },
  {
    method: 'GET',
    path: '/api/servers/{slug}',
    summary:
      'Full detail for one server, including install commands, tools, and security findings.',
  },
  {
    method: 'GET',
    path: '/api/servers/{slug}/related',
    summary: 'Up to six alternatives, ranked by category overlap then Trust Score.',
  },
  {
    method: 'GET',
    path: '/api/search',
    summary: 'Typeahead search. Ranked by relevance, then Trust Score.',
    params: [
      ['q', 'Required. The search term.'],
      ['limit', 'Results to return, 1–20. Default 8.'],
    ],
  },
  {
    method: 'GET',
    path: '/api/categories',
    summary: 'Every category with its live server count.',
  },
  { method: 'GET', path: '/api/stats', summary: 'Aggregate totals for the whole index.' },
  {
    method: 'GET',
    path: '/api/badge/{slug}',
    summary: 'An embeddable Trust Score badge as SVG. Always returns 200.',
  },
];

const AUTH_ENDPOINTS: Endpoint[] = [
  {
    method: 'POST',
    path: '/api/submissions',
    summary: 'Submit a repository for indexing.',
    auth: true,
  },
  {
    method: 'POST',
    path: '/api/servers/{slug}/ratings',
    summary: 'Rate a server 1–5.',
    auth: true,
  },
  { method: 'POST', path: '/api/servers/{slug}/report', summary: 'Flag a server.', auth: true },
  { method: 'GET', path: '/api/me/favorites', summary: "The caller's saved servers.", auth: true },
  {
    method: 'POST',
    path: '/api/me/favorites/{slug}',
    summary: 'Toggle a server in the caller’s favourites.',
    auth: true,
  },
];

/** Renders one endpoint block. */
function EndpointRow({ endpoint }: { endpoint: Endpoint }): React.JSX.Element {
  return (
    <div className="border-b py-5 last:border-0">
      <div className="flex flex-wrap items-baseline gap-3">
        <span
          className={
            endpoint.method === 'GET'
              ? 'text-success rounded-md border px-2 py-0.5 font-mono text-[11px]'
              : 'text-warn rounded-md border px-2 py-0.5 font-mono text-[11px]'
          }
        >
          {endpoint.method}
        </span>
        <code className="font-mono text-sm">{endpoint.path}</code>
        {endpoint.auth && (
          <span className="text-text-muted rounded-md border px-2 py-0.5 font-mono text-[11px]">
            auth
          </span>
        )}
      </div>

      <p className="text-text-secondary mt-2 text-sm leading-relaxed">{endpoint.summary}</p>

      {endpoint.params && (
        <dl className="mt-4 space-y-1.5">
          {endpoint.params.map(([name, detail]) => (
            <div key={name} className="grid grid-cols-[7rem_1fr] gap-3">
              <dt className="text-accent font-mono text-xs">{name}</dt>
              <dd className="text-text-muted text-xs leading-relaxed">{detail}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

/** Public API documentation. */
export default function ApiDocsPage(): React.JSX.Element {
  return (
    <main className="container max-w-3xl py-12">
      <p className="eyebrow">Public API</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">API documentation</h1>

      <p className="text-text-secondary mt-5 text-lg leading-relaxed">
        Everything the site itself runs on is public. No key, no signup, no quota beyond a fair-use
        rate limit — build whatever you like on top of it.
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">Base URL</h2>
        <pre className="bg-surface mt-3 overflow-x-auto rounded-xl border p-4 font-mono text-xs">
          <code>{SITE_URL}</code>
        </pre>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">Quick start</h2>
        <pre className="bg-surface mt-3 overflow-x-auto rounded-xl border p-4 font-mono text-xs leading-relaxed">
          <code>{`# The ten highest-scoring database servers
curl "${SITE_URL}/api/servers?category=database&sort=trust&pageSize=10"

# Search
curl "${SITE_URL}/api/search?q=postgres"

# One server in full
curl "${SITE_URL}/api/servers/mcp-server-postgrest"`}</code>
        </pre>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight">Public endpoints</h2>
        <div className="mt-4">
          {PUBLIC_ENDPOINTS.map((endpoint) => (
            <EndpointRow key={endpoint.path} endpoint={endpoint} />
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight">Authenticated endpoints</h2>
        <p className="text-text-muted mt-2 text-sm leading-relaxed">
          These require a Supabase session cookie from GitHub sign-in. Row-level security scopes
          every one of them to the calling user.
        </p>
        <div className="mt-4">
          {AUTH_ENDPOINTS.map((endpoint) => (
            <EndpointRow key={endpoint.path} endpoint={endpoint} />
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight">Rate limits</h2>
        <p className="text-text-secondary mt-3 text-sm leading-relaxed">
          Per IP address. Exceeding a limit returns <code className="font-mono">429</code> with a{' '}
          <code className="font-mono">Retry-After</code> header; every response carries{' '}
          <code className="font-mono">X-RateLimit-Remaining</code>.
        </p>
        <ul className="text-text-secondary mt-4 space-y-1.5 font-mono text-xs">
          <li>
            Reads — {RATE_LIMITS.read.requests} requests per {RATE_LIMITS.read.window}
          </li>
          <li>
            Writes — {RATE_LIMITS.write.requests} requests per {RATE_LIMITS.write.window}
          </li>
          <li>
            Submissions — {RATE_LIMITS.submission.requests} per {RATE_LIMITS.submission.window}
          </li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight">Errors</h2>
        <p className="text-text-secondary mt-3 text-sm leading-relaxed">
          Every failure returns the same envelope, so you can branch on{' '}
          <code className="font-mono">code</code> rather than parse prose.
        </p>
        <pre className="bg-surface mt-3 overflow-x-auto rounded-xl border p-4 font-mono text-xs leading-relaxed">
          <code>{`{
  "error": {
    "code": "NOT_FOUND",
    "message": "No server found with slug \\"example\\".",
    "details": { }
  }
}`}</code>
        </pre>
        <p className="text-text-muted mt-3 font-mono text-xs">
          BAD_REQUEST · UNAUTHORIZED · FORBIDDEN · NOT_FOUND · CONFLICT · RATE_LIMITED · INTERNAL ·
          UPSTREAM_UNAVAILABLE
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight">Badges</h2>
        <p className="text-text-secondary mt-3 text-sm leading-relaxed">
          Show your server&apos;s Trust Score in its own README.
        </p>
        <pre className="bg-surface mt-3 overflow-x-auto rounded-xl border p-4 font-mono text-xs">
          <code>{`![MCPHub Trust Score](${SITE_URL}/api/badge/your-slug)`}</code>
        </pre>
      </section>

      <p className="text-text-muted mt-12 border-t pt-6 text-sm">
        Responses are cached at the edge. Please cache on your side too rather than polling —{' '}
        <Link href="/submit" className="text-accent underline underline-offset-2">
          submit a server
        </Link>{' '}
        if you want something indexed.
      </p>
    </main>
  );
}
