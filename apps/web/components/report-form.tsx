'use client';

import { REPORT_REASONS, createReportSchema, type ReportReason } from '@mcphub/shared';
import { CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { AuthButton } from '@/components/auth-button';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Human-readable label and explanation for each report reason. */
const REASON_COPY: Record<ReportReason, { label: string; detail: string }> = {
  malicious: {
    label: 'Malicious',
    detail: 'It does something harmful — exfiltrates data, runs unexpected code, or misleads.',
  },
  broken: {
    label: 'Broken',
    detail: 'It does not install or run, or the install command here is wrong.',
  },
  spam: {
    label: 'Spam',
    detail: 'It is not a real MCP server, or exists only to advertise something.',
  },
  other: { label: 'Something else', detail: 'Wrong metadata, wrong category, duplicate listing.' },
};

/** Props for {@link ReportForm}. */
export interface ReportFormProps {
  slug: string;
  className?: string;
}

/** The report form. Requires sign-in; RLS pins the report to the caller. */
export function ReportForm({ slug, className }: ReportFormProps): React.JSX.Element {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    setNeedsAuth(false);

    const parsed = createReportSchema.safeParse({
      reason,
      details: details.trim() || undefined,
    });

    if (!parsed.success) {
      setError('Please choose a reason.');
      return;
    }

    setStatus('sending');

    try {
      const response = await fetch(`/api/servers/${slug}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      if (response.ok) {
        setStatus('done');
        return;
      }

      setStatus('idle');
      if (response.status === 401) setNeedsAuth(true);
      setError(
        response.status === 401
          ? 'You need to sign in before filing a report.'
          : 'Could not file your report. Please try again.',
      );
    } catch {
      setStatus('idle');
      setError('Could not reach the server. Check your connection and try again.');
    }
  };

  if (status === 'done') {
    return (
      <div className={cn('panel rounded-2xl p-8 text-center', className)}>
        <CheckCircle2 className="text-success mx-auto size-8" aria-hidden />
        <h2 className="mt-4 font-medium">Report received</h2>
        <p className="text-text-secondary mx-auto mt-2 max-w-sm text-sm leading-relaxed">
          Thanks. A maintainer will review this. If it turns out to be a security issue we will flag
          the listing while it is investigated.
        </p>
        <Button asChild variant="secondary" className="mt-6">
          <Link href={`/servers/${slug}`}>Back to the server</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={cn('space-y-6', className)} noValidate>
      <fieldset>
        <legend className="text-sm font-medium">What is wrong?</legend>
        <div className="mt-3 space-y-2">
          {REPORT_REASONS.map((value) => {
            const copy = REASON_COPY[value];
            const active = reason === value;

            return (
              <label
                key={value}
                className={cn(
                  'flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors duration-200',
                  active
                    ? 'border-accent/40 bg-accent/[0.06]'
                    : 'bg-surface hover:border-hover hover:bg-surface-hover',
                )}
              >
                <input
                  type="radio"
                  name="reason"
                  value={value}
                  checked={active}
                  onChange={() => setReason(value)}
                  className="checkbox-accent mt-0.5 rounded-full"
                />
                <span>
                  <span className="block text-sm font-medium">{copy.label}</span>
                  <span className="text-text-muted mt-0.5 block text-xs leading-relaxed">
                    {copy.detail}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="details" className="block text-sm font-medium">
          Details (optional)
        </label>
        <textarea
          id="details"
          rows={4}
          maxLength={1000}
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          placeholder="What did you see? A link to an issue or commit helps a lot."
          className="bg-surface hover:border-hover mt-2 w-full rounded-xl border p-3 text-sm transition-colors"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="border-danger/30 bg-danger/10 text-danger rounded-xl border p-3 text-sm"
        >
          {error}
          {needsAuth && (
            <div className="mt-3">
              <AuthButton variant="full" redirectTo={`/servers/${slug}/report`} />
            </div>
          )}
        </div>
      )}

      <Button type="submit" size="lg" disabled={status === 'sending' || !reason}>
        {status === 'sending' && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {status === 'sending' ? 'Sending…' : 'Submit report'}
      </Button>
    </form>
  );
}
