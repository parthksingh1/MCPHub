'use client';

import type { User } from '@supabase/supabase-js';
import { Bookmark, Loader2, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { AuthButton } from '@/components/auth-button';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

/** Props for {@link ServerActions}. */
export interface ServerActionsProps {
  slug: string;
  /** Current denormalised aggregate, so the widget renders correctly on first paint. */
  ratingAvg: number;
  ratingCount: number;
  className?: string;
}

/**
 * Favourite and rating controls for a server detail page.
 *
 * Both APIs existed from the start but had no interface, so nothing on the
 * site could reach them. State is loaded client-side rather than server-side
 * because the detail page is ISR-cached and shared between every visitor —
 * baking one user's favourite state into that cache would show it to everyone.
 */
export function ServerActions({
  slug,
  ratingAvg,
  ratingCount,
  className,
}: ServerActionsProps): React.JSX.Element {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);

  const [myRating, setMyRating] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [savingRating, setSavingRating] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user ?? null);

      if (data.user) {
        // RLS scopes both reads to the caller, so no user filter is needed.
        const [{ data: fav }, { data: rating }] = await Promise.all([
          supabase
            .from('favorites')
            .select('server_id, servers!inner(slug)')
            .eq('servers.slug', slug)
            .maybeSingle(),
          supabase
            .from('ratings')
            .select('rating, servers!inner(slug)')
            .eq('servers.slug', slug)
            .maybeSingle(),
        ]);

        setFavorited(Boolean(fav));
        setMyRating(rating?.rating ?? null);
      }

      setLoading(false);
    });
  }, [slug]);

  const toggleFavorite = useCallback(async () => {
    if (!user) {
      setNeedsAuth(true);
      return;
    }

    setSavingFavorite(true);
    setError(null);

    // Optimistic: a bookmark toggle that waits on a round-trip feels broken.
    const previous = favorited;
    setFavorited(!previous);

    try {
      const response = await fetch(`/api/me/favorites/${slug}`, { method: 'POST' });
      if (!response.ok) throw new Error(String(response.status));

      const body = (await response.json()) as { favorited: boolean };
      setFavorited(body.favorited);
    } catch {
      setFavorited(previous);
      setError('Could not save that. Please try again.');
    } finally {
      setSavingFavorite(false);
    }
  }, [favorited, slug, user]);

  const rate = useCallback(
    async (value: number) => {
      if (!user) {
        setNeedsAuth(true);
        return;
      }

      setSavingRating(true);
      setError(null);

      const previous = myRating;
      setMyRating(value);

      try {
        const response = await fetch(`/api/servers/${slug}/ratings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating: value }),
        });

        if (!response.ok) throw new Error(String(response.status));

        // A trigger recomputes the server's aggregate, so re-render the page
        // to pick up the new average rather than guessing at it here.
        router.refresh();
      } catch {
        setMyRating(previous);
        setError('Could not save your rating. Please try again.');
      } finally {
        setSavingRating(false);
      }
    },
    [myRating, router, slug, user],
  );

  if (loading) {
    return <div className={cn('bg-surface-hover h-10 animate-pulse rounded-lg', className)} />;
  }

  const shown = hovered ?? myRating ?? 0;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={toggleFavorite}
          disabled={savingFavorite}
          aria-pressed={favorited}
          className={cn(
            'inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium',
            'transition-all duration-200 active:scale-[0.98] disabled:opacity-50',
            favorited
              ? 'border-foreground bg-surface-hover text-foreground'
              : 'bg-surface hover:border-hover hover:bg-surface-hover',
          )}
        >
          {savingFavorite ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Bookmark className={cn('size-4', favorited && 'fill-current')} aria-hidden />
          )}
          {favorited ? 'Saved' : 'Save'}
        </button>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <div
            className="flex items-center"
            onMouseLeave={() => setHovered(null)}
            role="radiogroup"
            aria-label="Rate this server"
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={myRating === value}
                aria-label={`${value} star${value === 1 ? '' : 's'}`}
                disabled={savingRating}
                onMouseEnter={() => setHovered(value)}
                onFocus={() => setHovered(value)}
                onBlur={() => setHovered(null)}
                onClick={() => rate(value)}
                className="p-0.5 transition-transform duration-150 hover:scale-110 disabled:opacity-50"
              >
                <Star
                  className={cn(
                    'size-4 transition-colors',
                    value <= shown ? 'text-warn fill-current' : 'text-text-muted',
                  )}
                  aria-hidden
                />
              </button>
            ))}
          </div>

          <span className="text-text-muted ml-1.5 text-xs tabular-nums">
            {ratingCount > 0 ? `${ratingAvg.toFixed(1)} · ${ratingCount}` : 'Not yet rated'}
          </span>
        </div>
      </div>

      {myRating !== null && !savingRating && (
        <p className="text-text-muted text-xs">You rated this {myRating}/5.</p>
      )}

      {error && (
        <p role="alert" className="text-danger text-xs">
          {error}
        </p>
      )}

      {needsAuth && !user && (
        <div className="panel max-w-xs rounded-xl p-4">
          <p className="text-text-secondary mb-3 text-xs leading-relaxed">
            Sign in to save servers and rate them.
          </p>
          <AuthButton variant="full" redirectTo={`/servers/${slug}`} />
        </div>
      )}
    </div>
  );
}
