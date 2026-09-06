import { createRatingSchema } from '@mcphub/shared';
import { NextResponse } from 'next/server';

import { ApiException, errorResponse, getClientIp, parseBody, withErrorHandling } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { invalidate, cacheKey } from '@/lib/cache';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';

/** Route params for a single server. */
interface RouteContext {
  params: Promise<{ slug: string }>;
}

/**
 * `POST /api/servers/[slug]/ratings` — rate a server 1-5, with an optional
 * written review.
 *
 * Writes go through the user's own Supabase client rather than the service
 * role, so RLS enforces the "one rating per user, own rows only" rule in the
 * database. The route never needs its own ownership check, and cannot forget
 * one.
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
  const input = await parseBody(createRatingSchema, request);

  const supabase = await createClient();

  const { data: server, error: lookupError } = await supabase
    .from('servers')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (lookupError) throw new ApiException('INTERNAL', 'Could not look up that server.');
  if (!server) throw new ApiException('NOT_FOUND', `No server found with slug "${slug}".`);

  // Upsert on (server_id, user_id): re-rating replaces the previous rating
  // rather than failing, which is what a person changing their mind expects.
  const { data, error } = await supabase
    .from('ratings')
    .upsert(
      {
        server_id: server.id,
        user_id: user.id,
        rating: input.rating,
        review: input.review ?? null,
      },
      { onConflict: 'server_id,user_id' },
    )
    .select('id, rating, review, created_at')
    .single();

  if (error) throw new ApiException('INTERNAL', 'Could not save your rating.');

  // The rating aggregate is denormalised onto the server row by a trigger, so
  // the cached detail payload is now stale.
  await invalidate(cacheKey('server', { slug }));

  return NextResponse.json(data, { status: 201, headers: rateLimitHeaders(limit) });
});
