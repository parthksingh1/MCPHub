'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/** Props for {@link SpotlightForm}. */
export interface SpotlightFormProps {
  /** Lowest bid that would currently reach the homepage strip, in cents. */
  stripCents: number;
  minCents: number;
  maxCents: number;
  days: number;
  /** Rupees per dollar, for the INR price preview. */
  usdInr: number;
}

/**
 * The Spotlight bid form.
 *
 * Pre-fills the bid that would reach the homepage strip, so the most common
 * question — "how much do I need?" — is answered before it is asked.
 */
export function SpotlightForm({
  stripCents,
  minCents,
  maxCents,
  days,
  usdInr,
}: SpotlightFormProps): React.JSX.Element {
  const [slug, setSlug] = useState('');
  const [dollars, setDollars] = useState(String(Math.max(stripCents, minCents) / 100));
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const [authorised, setAuthorised] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cents = Math.round(Number(dollars) * 100);
  const validAmount = Number.isInteger(Number(dollars)) && cents >= minCents && cents <= maxCents;
  // Mirrors the server's conversion: whole rupees.
  const rupees = Math.round((cents / 100) * usdInr);
  const price = currency === 'USD' ? `$${cents / 100}` : `₹${rupees.toLocaleString('en-IN')}`;
  const cleanSlug = slug
    .trim()
    .toLowerCase()
    .replace(/^.*\/servers\//, '')
    .replace(/[^a-z0-9-]/g, '');

  /** Requests a payment link and hands the browser over to Razorpay. */
  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch('/api/spotlight/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: cleanSlug, amountCents: cents, currency, authorised }),
      });
      const body = (await response.json()) as { url?: string; error?: { message?: string } };
      if (!response.ok || !body.url) {
        throw new Error(body.error?.message ?? 'Could not start checkout.');
      }
      window.location.assign(body.url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not start checkout.');
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="spotlight-slug" className="text-sm font-medium">
          Server
        </label>
        <Input
          id="spotlight-slug"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder="Slug or MCPHub URL, e.g. github-mcp-server"
          autoComplete="off"
          spellCheck={false}
          required
          className="mt-1.5 font-mono"
        />
      </div>

      <div>
        <label htmlFor="spotlight-amount" className="text-sm font-medium">
          Your bid (USD, for {days} days)
        </label>
        <div className="relative mt-1.5">
          <span className="text-text-muted pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm">
            $
          </span>
          <Input
            id="spotlight-amount"
            type="number"
            inputMode="numeric"
            min={minCents / 100}
            max={maxCents / 100}
            step={1}
            value={dollars}
            onChange={(event) => setDollars(event.target.value)}
            required
            aria-describedby="spotlight-amount-help"
            className="pl-7 tabular-nums"
          />
        </div>
        <p id="spotlight-amount-help" className="text-text-muted mt-1.5 text-xs">
          Whole dollars, ${minCents / 100}–${maxCents / 100}.{' '}
          {stripCents > minCents
            ? `$${stripCents / 100} or more currently reaches the homepage strip.`
            : 'Any bid currently reaches the homepage strip.'}
        </p>
      </div>

      <fieldset>
        <legend className="text-sm font-medium">Pay in</legend>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          {(
            [
              { id: 'USD', label: 'USD', hint: 'International cards' },
              { id: 'INR', label: 'INR', hint: 'UPI, Indian cards' },
            ] as const
          ).map((option) => (
            <label
              key={option.id}
              className={cn(
                'cursor-pointer rounded-lg border p-2.5 transition-colors focus-within:ring-2',
                currency === option.id
                  ? 'border-foreground bg-surface-hover'
                  : 'hover:border-hover',
              )}
            >
              <input
                type="radio"
                name="currency"
                value={option.id}
                checked={currency === option.id}
                onChange={() => setCurrency(option.id)}
                className="sr-only"
              />
              <span className="block text-sm font-medium">{option.label}</span>
              <span className="text-text-muted block text-xs">{option.hint}</span>
            </label>
          ))}
        </div>
        {currency === 'INR' && validAmount && (
          <p className="text-text-muted mt-1.5 text-xs">
            ${cents / 100} is charged as ₹{rupees.toLocaleString('en-IN')} (at ₹{usdInr}/$).
          </p>
        )}
      </fieldset>

      <label className="flex items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={authorised}
          onChange={(event) => setAuthorised(event.target.checked)}
          className="accent-foreground mt-0.5 size-4"
        />
        <span className="text-text-secondary">
          I maintain this server or have the maintainer&apos;s permission, and I accept the{' '}
          <a href="/legal/terms#spotlight" className="underline underline-offset-2">
            Spotlight terms
          </a>
          .
        </span>
      </label>

      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={pending || !cleanSlug || !validAmount || !authorised}
      >
        {pending ? 'Opening checkout…' : `Continue to payment — ${validAmount ? price : '…'}`}
      </Button>
      <p className="text-text-muted text-center text-xs">Secure payment by Razorpay.</p>
    </form>
  );
}
