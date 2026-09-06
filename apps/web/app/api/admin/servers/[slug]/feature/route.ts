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

const bodySchema = z.object({ featured: z.boolean() });

/** `POST /api/admin/servers/[slug]/feature` — pin a server to the homepage. */
export const POST = withErrorHandling(async (request: Request, context: RouteContext) => {
  const { slug } = await context.params;

  await requireAdmin();
  const { featured } = await parseBody(bodySchema, request);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('servers')
    .update({ featured })
    .eq('slug', slug)
    .select('slug, featured')
    .maybeSingle();

  if (error) throw new ApiException('INTERNAL', 'Could not update that server.');
  if (!data) throw new ApiException('NOT_FOUND', `No server found with slug "${slug}".`);

  // The featured set drives the homepage, so both caches are now stale.
  await invalidate(cacheKey('server', { slug }));
  await invalidate(cacheKey('featured'));

  return NextResponse.json(data);
});
