'use client';

import type { User } from '@supabase/supabase-js';
import { Github, LogOut, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

/** Props for {@link AuthButton}. */
export interface AuthButtonProps {
  /** Renders a full-width button with a label, for use outside the header. */
  variant?: 'compact' | 'full';
  /** Where to return after signing in. Defaults to the current path. */
  redirectTo?: string;
  className?: string;
}

/**
 * GitHub sign-in, and the signed-in user's menu.
 *
 * Session state is read on the client and kept current through
 * `onAuthStateChange`, so the control updates the moment a sign-in completes
 * in this tab — without it the header would keep showing "Sign in" until a
 * full reload.
 *
 * `router.refresh()` after either transition is what re-runs the Server
 * Components that read the session cookie; without it the dashboard and any
 * server-rendered auth state would be a step behind the button.
 */
export function AuthButton({
  variant = 'compact',
  redirectTo,
  className,
}: AuthButtonProps): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    // `getUser` verifies the token with the auth server, unlike `getSession`,
    // which only decodes the cookie.
    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  // Close the menu on an outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event: MouseEvent): void => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const signIn = useCallback(async () => {
    setBusy(true);

    const next = redirectTo ?? pathname;
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    // On success the browser is already navigating away, so only a failure
    // ever reaches this line.
    if (error) setBusy(false);
  }, [pathname, redirectTo]);

  const signOut = useCallback(async () => {
    setBusy(true);
    setMenuOpen(false);

    await createClient().auth.signOut();

    setBusy(false);
    router.refresh();
  }, [router]);

  if (loading) {
    return <div className={cn('bg-surface-hover size-8 animate-pulse rounded-lg', className)} />;
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={signIn}
        disabled={busy}
        className={cn(
          'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium',
          'transition-all duration-200 ease-out active:scale-[0.98] disabled:opacity-50',
          variant === 'compact'
            ? 'bg-surface hover:border-hover hover:bg-surface-hover h-8 border px-3'
            : 'from-accent-from to-accent-to text-accent-foreground h-11 w-full bg-gradient-to-b px-6 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.18)] hover:brightness-110',
          className,
        )}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Github className="size-4" aria-hidden />
        )}
        {variant === 'compact' ? 'Sign in' : 'Sign in with GitHub'}
      </button>
    );
  }

  const avatar =
    typeof user.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : null;
  const handle =
    (typeof user.user_metadata?.user_name === 'string' ? user.user_metadata.user_name : null) ??
    user.email ??
    'Account';

  return (
    <div ref={menuRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={`Account menu for ${handle}`}
        className="hover:border-hover flex size-8 items-center justify-center overflow-hidden rounded-lg border transition-colors"
      >
        {avatar ? (
          <Image src={avatar} alt="" width={32} height={32} className="size-full object-cover" />
        ) : (
          <span className="text-text-muted text-xs font-medium uppercase">
            {handle.slice(0, 2)}
          </span>
        )}
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="panel animate-fade-up shadow-card absolute right-0 top-10 z-50 w-52 overflow-hidden rounded-xl"
        >
          <p className="text-text-muted truncate border-b px-3 py-2.5 font-mono text-[11px]">
            {handle}
          </p>

          <a
            role="menuitem"
            href="/dashboard"
            className="hover:bg-surface-hover block px-3 py-2 text-sm transition-colors"
          >
            Your dashboard
          </a>

          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            disabled={busy}
            className="hover:bg-surface-hover flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors disabled:opacity-50"
          >
            <LogOut className="size-3.5" aria-hidden />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
