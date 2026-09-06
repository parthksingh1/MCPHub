'use client';

import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

/** Props Next.js passes to an error boundary. */
interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * The error boundary.
 *
 * Shows the digest rather than the message: the digest is a stable, safe
 * identifier that can be quoted in a bug report, whereas a raw error message
 * from a server component routinely contains a connection string.
 */
export default function ErrorPage({ error, reset }: ErrorPageProps): React.JSX.Element {
  useEffect(() => {
    console.error('[boundary]', error);
  }, [error]);

  return (
    <main className="container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <svg
        width="120"
        height="80"
        viewBox="0 0 120 80"
        fill="none"
        aria-hidden
        className="text-warn"
      >
        <path
          d="M60 18l38 46H22l38-46z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M60 36v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="60" cy="55" r="1.6" fill="currentColor" />
      </svg>

      <h1 className="mt-8 text-2xl font-semibold tracking-tight">That did not work</h1>
      <p className="text-text-secondary mt-3 max-w-sm text-sm leading-relaxed">
        Something failed on our end, not yours. The directory itself is fine — try again, and if it
        keeps happening we would like to know.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="secondary">
          <a
            href="https://github.com/mcphub/mcphub/issues/new"
            target="_blank"
            rel="noreferrer noopener"
          >
            Report it
          </a>
        </Button>
      </div>

      {error.digest && (
        <p className="text-text-muted mt-6 font-mono text-xs">Reference: {error.digest}</p>
      )}
    </main>
  );
}
