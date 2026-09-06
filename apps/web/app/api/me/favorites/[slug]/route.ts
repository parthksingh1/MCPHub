import { NextResponse } from 'next/server';

import { ApiException, errorResponse, getClientIp, withErrorHandling } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';

/** Route params for a single server. */
interface RouteContext {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

/**
 * `POST /api/me/favorites/[slug]` — toggle a server in the user's favourites.
 *
 * A toggle rather than separate add and remove endpoints: the UI is a single
 * button, and modelling it as one idempotent-per-intent call removes the class
 * of bug where the client's idea of the current state has drifted.
 */
export const POST = withErrorHandling(async (request: Request, context: RouteContext) => {
  const { slug } = await context.params;

  const limit = await checkRateLimit('write', getClientIp(request));
  if (!limit.success) {
    return errorResponse(
      'RATE_LIMITED',
      'Too many requests. Please slow down.',
      undefined,
      rateLimitHeaders(limit),
    );
  }

  const user = await requireUser();
  const supabase = await createClient();

  const { data: server, error: lookupError } = await supabase
    .from('servers')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (lookupError) throw new ApiException('INTERNAL', 'Could not look up that server.');
  if (!server) throw new ApiException('NOT_FOUND', `No server found with slug "${slug}".`);

  const { data: existing } = await supabase
    .from('favorites')
    .select('server_id')
    .eq('server_id', server.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from('favorites').delete().eq('server_id', server.id);
    if (error) throw new ApiException('INTERNAL', 'Could not remove that favourite.');

    return NextResponse.json({ favorited: false }, { headers: rateLimitHeaders(limit) });
  }

  const { error } = await supabase
    .from('favorites')
    .insert({ server_id: server.id, user_id: user.id });

  if (error) throw new ApiException('INTERNAL', 'Could not save that favourite.');

  return NextResponse.json({ favorited: true }, { headers: rateLimitHeaders(limit) });
});
