import { createReportSchema } from '@mcphub/shared';
import { NextResponse } from 'next/server';

import { ApiException, errorResponse, getClientIp, parseBody, withErrorHandling } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';

/** Route params for a single server. */
interface RouteContext {
  params: Promise<{ slug: string }>;
}

/**
 * `POST /api/servers/[slug]/report` — flag a server as spam, malicious, or
 * broken.
 *
 * The response deliberately carries no report id or detail. RLS gives users no
 * read access to `reports` at all, so a reporter cannot enumerate other
 * people's reports — and echoing anything back would undermine that.
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
  const input = await parseBody(createReportSchema, request);

  const supabase = await createClient();

  const { data: server, error: lookupError } = await supabase
    .from('servers')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (lookupError) throw new ApiException('INTERNAL', 'Could not look up that server.');
  if (!server) throw new ApiException('NOT_FOUND', `No server found with slug "${slug}".`);

  const { error } = await supabase.from('reports').insert({
    server_id: server.id,
    reported_by: user.id,
    reason: input.reason,
    details: input.details ?? null,
  });

  if (error) throw new ApiException('INTERNAL', 'Could not file your report.');

  return NextResponse.json(
    { ok: true, message: 'Thanks — we will review this.' },
    { status: 201, headers: rateLimitHeaders(limit) },
  );
});
