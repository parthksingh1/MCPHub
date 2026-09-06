import { NextResponse } from 'next/server';
import { z } from 'zod';

import { ApiException, parseBody, withErrorHandling } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { cacheKey, invalidate } from '@/lib/cache';
import { createClient } from '@/lib/supabase/server';

/** Route params for a single server. */
interface RouteContext {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

const bodySchema = z.object({ verified: z.boolean() });

/**
 * `POST /api/admin/servers/[slug]/verify` — mark a server as human-verified.
 *
 * Authorisation is enforced twice, on purpose: `requireAdmin` gives a clean
 * 403, and the RLS policy behind the user's own client independently refuses
 * the write. The check in the route is a courtesy to the caller; the database
 * is what actually protects the data.
 */
export const POST = withErrorHandling(async (request: Request, context: RouteContext) => {
  const { slug } = await context.params;

  await requireAdmin();
  const { verified } = await parseBody(bodySchema, request);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('servers')
    .update({ verified })
    .eq('slug', slug)
    .select('slug, verified')
    .maybeSingle();

  if (error) throw new ApiException('INTERNAL', 'Could not update that server.');
  if (!data) throw new ApiException('NOT_FOUND', `No server found with slug "${slug}".`);

  await invalidate(cacheKey('server', { slug }));

  return NextResponse.json(data);
});
