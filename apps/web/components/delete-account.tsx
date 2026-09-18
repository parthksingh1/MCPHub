'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** The exact phrase the API requires; kept in step with `DELETE /api/me`. */
const CONFIRMATION = 'delete my account';

/**
 * Account deletion, behind two deliberate steps.
 *
 * The first click only reveals the form; the second requires typing the
 * phrase. Irreversible actions should never be one mis-click away.
 */
export function DeleteAccount(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Sends the deletion request and leaves the signed-in area on success. */
  async function handleDelete(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch('/api/me', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: typed.trim().toLowerCase() }),
      });
      if (!response.ok) throw new Error();
      // A full navigation, so every server component re-renders signed out.
      window.location.assign('/?account=deleted');
    } catch {
      setError('Something went wrong and your account was not deleted. Please try again.');
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="danger-zone" className="border-danger/40 mt-16 rounded-xl border p-5">
      <h2 id="danger-zone" className="font-semibold tracking-tight">
        Delete account
      </h2>
      <p className="text-text-muted mt-1.5 max-w-prose text-sm leading-relaxed">
        Permanently removes your profile, favourites, ratings and reviews. Reports and submissions
        you made stay, without your name. This cannot be undone.
      </p>

      {!open ? (
        <Button variant="outline" className="mt-4" onClick={() => setOpen(true)}>
          Delete account…
        </Button>
      ) : (
        <form onSubmit={handleDelete} className="mt-4 max-w-sm space-y-3">
          <label htmlFor="delete-confirm" className="block text-sm">
            Type <span className="font-mono font-medium">{CONFIRMATION}</span> to confirm
          </label>
          <Input
            id="delete-confirm"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-describedby={error ? 'delete-error' : undefined}
          />
          {error && (
            <p id="delete-error" role="alert" className="text-danger text-sm">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              type="submit"
              variant="destructive"
              disabled={pending || typed.trim().toLowerCase() !== CONFIRMATION}
            >
              {pending ? 'Deleting…' : 'Permanently delete'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                setTyped('');
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
