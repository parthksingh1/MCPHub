import Link from 'next/link';

import { Button } from '@/components/ui/button';

/** The 404 page. On-brand rather than alarming. */
export default function NotFound(): React.JSX.Element {
  return (
    <main className="container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <svg
        width="120"
        height="80"
        viewBox="0 0 120 80"
        fill="none"
        aria-hidden
        className="text-text-muted"
      >
        {/* An unplugged connector: the protocol metaphor, drawn simply. */}
        <rect x="6" y="30" width="34" height="20" rx="4" stroke="currentColor" strokeWidth="2" />
        <path d="M40 40h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M66 40h14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="3 4"
        />
        <rect x="80" y="30" width="34" height="20" rx="4" stroke="currentColor" strokeWidth="2" />
        <path
          d="M57 33l6 14M63 33l-6 14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      <h1 className="mt-8 text-2xl font-semibold tracking-tight">Nothing connected here</h1>
      <p className="text-text-secondary mt-3 max-w-sm text-sm leading-relaxed">
        This page does not exist. The server may have been renamed, deprecated, or never indexed in
        the first place.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/servers">Browse servers</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/">Back home</Link>
        </Button>
      </div>

      <p className="text-text-muted mt-6 text-xs">
        Press <kbd className="rounded border px-1.5 py-0.5 font-mono">⌘K</kbd> to search.
      </p>
    </main>
  );
}
