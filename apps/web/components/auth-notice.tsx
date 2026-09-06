'use client';

import { AlertTriangle, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/** What each `?auth=` value means to the user. */
const MESSAGES: Record<string, string> = {
  failed: 'Sign-in did not complete. Please try again.',
  missing_code: 'Sign-in was cancelled or the link expired. Please try again.',
};

/**
 * Surfaces an OAuth failure.
 *
 * The callback route redirects to `/?auth=failed` when the code exchange
 * fails. Without this the user lands back on the homepage still signed out,
 * with nothing explaining why — indistinguishable from the button not working.
 *
 * The parameter is stripped from the URL once shown, so a refresh or a shared
 * link does not resurrect a stale error.
 */
export function AuthNotice(): React.JSX.Element | null {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const code = params.get('auth');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!code) return;

    const next = new URLSearchParams(params.toString());
    next.delete('auth');
    router.replace(next.size > 0 ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [code, params, pathname, router]);

  if (!code || dismissed) return null;

  const message = MESSAGES[code] ?? 'Something went wrong signing you in.';

  return (
    <div
      role="alert"
      className="border-danger/30 bg-danger/10 text-danger shadow-card fixed bottom-4 left-1/2 z-50 flex max-w-[min(92vw,26rem)] -translate-x-1/2 items-start gap-3 rounded-xl border p-4 text-sm backdrop-blur-xl"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p className="flex-1 leading-relaxed">{message}</p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="shrink-0 transition-opacity hover:opacity-70"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
