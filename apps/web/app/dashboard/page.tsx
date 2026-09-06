import type { Metadata } from 'next';
import Link from 'next/link';

import { AuthButton } from '@/components/auth-button';
import { TrustScoreRing } from '@/components/trust-score-ring';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

/** Per-user data; never cached, never prerendered. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your dashboard',
  robots: { index: false, follow: false },
};

/** A favourite row as returned by the join. */
interface FavoriteRow {
  created_at: string;
  servers: {
    slug: string;
    name: string;
    description: string;
    trust_total: number;
  } | null;
}

/** A submission row. */
interface SubmissionRow {
  id: string;
  repo_url: string;
  status: string;
  created_at: string;
}

/** The signed-in user's dashboard. */
export default async function DashboardPage(): Promise<React.JSX.Element> {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="container flex min-h-[60vh] max-w-md flex-col items-center justify-center py-20 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in required</h1>
        <p className="text-text-secondary mt-3 text-sm leading-relaxed">
          Sign in with GitHub to save favourites, rate servers, and track your submissions.
        </p>
        <div className="mt-7 w-full max-w-xs">
          <AuthButton variant="full" redirectTo="/dashboard" />
        </div>
        <Button asChild variant="ghost" className="mt-3">
          <Link href="/servers">Browse without signing in</Link>
        </Button>
      </main>
    );
  }

  const supabase = await createClient();

  // RLS scopes both queries to the caller's own rows, so no user filter is
  // needed here and none can be forgotten.
  const [favorites, submissions] = await Promise.all([
    supabase
      .from('favorites')
      .select('created_at, servers(slug, name, description, trust_total)')
      .order('created_at', { ascending: false })
      .returns<FavoriteRow[]>(),
    supabase
      .from('submissions')
      .select('id, repo_url, status, created_at')
      .order('created_at', { ascending: false })
      .returns<SubmissionRow[]>(),
  ]);

  const saved = favorites.data ?? [];
  const submitted = submissions.data ?? [];

  return (
    <main className="container py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Your dashboard</h1>
      <p className="text-text-muted mt-2 text-sm">{user.email}</p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">Favourites</h2>

        {saved.length === 0 ? (
          <p className="text-text-muted mt-3 text-sm">
            Nothing saved yet.{' '}
            <Link href="/servers" className="text-accent underline underline-offset-2">
              Browse servers
            </Link>{' '}
            and save the ones you use.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {saved.map((favorite) =>
              favorite.servers ? (
                <li key={favorite.servers.slug}>
                  <Link
                    href={`/servers/${favorite.servers.slug}`}
                    className="bg-surface hover:border-hover hover:bg-surface-hover flex items-center gap-4 rounded-lg border p-4 transition-colors"
                  >
                    <TrustScoreRing
                      score={favorite.servers.trust_total}
                      size={40}
                      strokeWidth={3}
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{favorite.servers.name}</span>
                      <span className="text-text-muted block truncate text-sm">
                        {favorite.servers.description}
                      </span>
                    </span>
                  </Link>
                </li>
              ) : null,
            )}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight">Your submissions</h2>

        {submitted.length === 0 ? (
          <p className="text-text-muted mt-3 text-sm">
            You have not submitted a server yet.{' '}
            <Link href="/submit" className="text-accent underline underline-offset-2">
              Submit one
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {submitted.map((submission) => (
              <li
                key={submission.id}
                className="bg-surface flex items-center justify-between gap-4 rounded-lg border p-4 text-sm"
              >
                <span className="truncate font-mono text-xs">{submission.repo_url}</span>
                <span className="text-text-muted shrink-0 capitalize">{submission.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
