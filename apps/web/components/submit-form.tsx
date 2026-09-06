'use client';

import { CATEGORIES, CATEGORY_LABELS, createSubmissionSchema } from '@mcphub/shared';
import { CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { AuthButton } from '@/components/auth-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/** What the API returns on a conflict, so we can link to the existing server. */
interface ApiError {
  error: { code: string; message: string; details?: { slug?: string } };
}

/** Props for {@link SubmitForm}. */
export interface SubmitFormProps {
  className?: string;
}

/**
 * The server submission form.
 *
 * Validated client-side with the same Zod schema the API uses, so a typo is
 * caught before a round-trip — and the server still re-validates, because
 * client-side validation is a convenience, never a control.
 */
export function SubmitForm({ className }: SubmitFormProps): React.JSX.Element {
  const [repoUrl, setRepoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [honeypot, setHoneypot] = useState('');

  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [duplicateSlug, setDuplicateSlug] = useState<string | null>(null);

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    setNeedsAuth(false);
    setDuplicateSlug(null);

    const parsed = createSubmissionSchema.safeParse({
      repoUrl,
      notes: notes || undefined,
      categories: selected.length > 0 ? selected : undefined,
      website: honeypot || undefined,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check the form.');
      return;
    }

    setStatus('sending');

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      if (response.ok) {
        setStatus('done');
        return;
      }

      const body = (await response.json()) as ApiError;
      setStatus('idle');

      if (response.status === 401) {
        setNeedsAuth(true);
        setError('You need to sign in before submitting a server.');
      } else if (response.status === 409) {
        setDuplicateSlug(body.error.details?.slug ?? null);
        setError(body.error.message);
      } else {
        setError(body.error?.message ?? 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('idle');
      setError('Could not reach the server. Check your connection and try again.');
    }
  };

  if (status === 'done') {
    return (
      <div className={cn('bg-surface rounded-lg border p-8 text-center', className)}>
        <CheckCircle2 className="text-success mx-auto size-8" aria-hidden />
        <h2 className="mt-4 font-medium">Submitted</h2>
        <p className="text-text-secondary mx-auto mt-2 max-w-sm text-sm leading-relaxed">
          We will index this within 24 hours. Once it is live it will appear in search, in its
          categories, and with a full Trust Score breakdown.
        </p>
        <Button asChild variant="secondary" className="mt-6">
          <Link href="/servers">Browse servers</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={cn('space-y-6', className)} noValidate>
      <div>
        <label htmlFor="repoUrl" className="block text-sm font-medium">
          GitHub repository URL
        </label>
        <Input
          id="repoUrl"
          type="url"
          required
          value={repoUrl}
          onChange={(event) => setRepoUrl(event.target.value)}
          placeholder="https://github.com/owner/mcp-server-example"
          className="mt-2"
          aria-describedby="repoUrl-hint"
        />
        <p id="repoUrl-hint" className="text-text-muted mt-1.5 text-xs">
          Must be a public GitHub repository containing an MCP server.
        </p>
      </div>

      <fieldset>
        <legend className="text-sm font-medium">Categories (optional)</legend>
        <p className="text-text-muted mt-1 text-xs">
          Pick up to three. We infer these automatically if you skip it.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {CATEGORIES.map((slug) => {
            const active = selected.includes(slug);
            const full = selected.length >= 3 && !active;

            return (
              <button
                key={slug}
                type="button"
                disabled={full}
                aria-pressed={active}
                onClick={() =>
                  setSelected((current) =>
                    active ? current.filter((item) => item !== slug) : [...current, slug],
                  )
                }
                className={cn(
                  'rounded-sm border px-2 py-1 text-xs transition-colors duration-200',
                  active
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'text-text-secondary hover:border-hover hover:bg-surface-hover',
                  full && 'cursor-not-allowed opacity-40',
                )}
              >
                {CATEGORY_LABELS[slug]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          rows={3}
          value={notes}
          maxLength={1000}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Anything we should know — what it does, who it is for."
          className="bg-surface hover:border-hover mt-2 w-full rounded-md border p-3 text-sm transition-colors"
        />
      </div>

      {/*
        Honeypot. Positioned off-screen rather than `display: none`, because
        some bots skip hidden inputs but almost all of them fill this one.
        Real users never see or tab to it.
      */}
      <div aria-hidden className="pointer-events-none absolute -left-[9999px] opacity-0">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

      {error && (
        <div
          role="alert"
          className="border-danger/30 bg-danger/10 text-danger rounded-md border p-3 text-sm"
        >
          {error}
          {needsAuth && (
            <div className="mt-3">
              <AuthButton variant="full" redirectTo={'/submit'} />
            </div>
          )}
          {duplicateSlug && (
            <>
              {' '}
              <Link
                href={`/servers/${duplicateSlug}`}
                className="underline underline-offset-2 hover:opacity-80"
              >
                View the existing listing
              </Link>
              .
            </>
          )}
        </div>
      )}

      <Button type="submit" size="lg" disabled={status === 'sending'}>
        {status === 'sending' && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {status === 'sending' ? 'Submitting…' : 'Submit server'}
      </Button>
    </form>
  );
}
