import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';

export const revalidate = 86_400;

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Writing about the Model Context Protocol ecosystem, security, and MCPHub itself.',
  alternates: { canonical: '/blog' },
};

/**
 * Launch posts.
 *
 * Kept as data rather than MDX for now: shipping an MDX pipeline before there
 * is content to run through it adds a build dependency that earns nothing.
 */
const POSTS = [
  {
    slug: 'what-is-mcp',
    title: 'What is MCP, and why does it matter?',
    excerpt:
      'The Model Context Protocol gives AI assistants a structured, permissioned way to reach real systems. Here is what that actually changes.',
    date: '2026-01-15',
  },
  {
    slug: 'ten-most-useful-mcp-servers',
    title: 'The 10 most useful MCP servers right now',
    excerpt: 'Ranked by Trust Score and actual daily usefulness, not by star count.',
    date: '2026-01-16',
  },
  {
    slug: 'how-we-score-mcp-servers',
    title: 'How we score MCP servers for trust',
    excerpt:
      'The full algorithm, why each weight is what it is, and what the number deliberately does not tell you.',
    date: '2026-01-17',
  },
  {
    slug: 'security-in-the-mcp-ecosystem',
    title: 'Security in the MCP ecosystem',
    excerpt:
      'An MCP server runs on your machine and acts on model output. That is a threat model worth taking seriously.',
    date: '2026-01-18',
  },
  {
    slug: 'introducing-mcphub',
    title: 'Introducing MCPHub',
    excerpt: 'Smithery lists them. We rate, scan, and vet them. Here is why we built it.',
    date: '2026-01-20',
  },
] as const;

/** The blog index. */
export default function BlogPage(): React.JSX.Element {
  return (
    <main className="container max-w-3xl py-8">
      <PageHeader
        crumbs={[{ label: 'Blog' }]}
        eyebrow="Writing"
        title="Blog"
        description="Writing about the MCP ecosystem, security, and how MCPHub works."
      />

      <div className="mt-10 space-y-8">
        {POSTS.map((post) => (
          <article key={post.slug} className="border-b pb-8 last:border-0">
            <p className="text-text-muted font-mono text-xs">
              {new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(post.date))}
            </p>
            <h2 className="mt-2 text-xl font-medium tracking-tight">{post.title}</h2>
            <p className="text-text-secondary mt-2 leading-relaxed">{post.excerpt}</p>
            <p className="text-text-muted mt-3 text-xs">Coming soon</p>
          </article>
        ))}
      </div>
    </main>
  );
}
