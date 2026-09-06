import { NextResponse } from 'next/server';

import { ApiException, withErrorHandling } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

/**
 * `GET /api/me/favorites` — the signed-in user's saved servers.
 *
 * Never cached: this is per-user data, and a shared cache keyed only by route
 * would serve one person's favourites to another.
 */
export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async () => {
  await requireUser();

  const supabase = await createClient();

  // RLS restricts `favorites` to the caller's own rows, so no user filter is
  // needed here — and cannot be forgotten.
  const { data, error } = await supabase
    .from('favorites')
    .select(
      'created_at, servers(slug, name, description, categories, trust_total, github_stars, author_avatar, verified)',
    )
    .order('created_at', { ascending: false });

  if (error) throw new ApiException('INTERNAL', 'Could not load your favourites.');

  return NextResponse.json(
    { favorites: data ?? [] },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
});
