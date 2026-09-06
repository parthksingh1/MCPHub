import { canonicalizeRepoUrl } from '@mcphub/crawler';
import { createSubmissionSchema } from '@mcphub/shared';
import { NextResponse } from 'next/server';

import { ApiException, errorResponse, getClientIp, parseBody, withErrorHandling } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { isLaunchMode } from '@/lib/env';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * `POST /api/submissions` — submit a server for indexing.
 *
 * Three layers of abuse protection, because this is the only route that lets
 * an anonymous-ish user write a row that a human will later read: a honeypot
 * field, a strict per-IP rate limit, and authentication. RLS additionally
 * pins `submitted_by` to the caller.
 */
export const POST = withErrorHandling(async (request: Request) => {
  if (isLaunchMode()) {
    throw new ApiException(
      'UPSTREAM_UNAVAILABLE',
      'Submissions are paused while we handle launch traffic. Please try again shortly.',
    );
  }

  const limit = await checkRateLimit('submission', getClientIp(request));
  if (!limit.success) {
    return errorResponse(
      'RATE_LIMITED',
      'You have submitted several servers already. Please try again later.',
      undefined,
      rateLimitHeaders(limit),
    );
  }

  const user = await requireUser();
  const input = await parseBody(createSubmissionSchema, request);

  // The honeypot is a field no real user can see or fill. Returning a normal
  // success response rather than an error denies the bot the signal it needs
  // to adapt, while the row is silently never written.
  if (input.website) {
    return NextResponse.json({ ok: true, status: 'pending' }, { status: 201 });
  }

  const repoUrl = canonicalizeRepoUrl(input.repoUrl);
  if (!repoUrl) {
    throw new ApiException('BAD_REQUEST', 'That does not look like a GitHub repository URL.');
  }

  const supabase = await createClient();

  // Already indexed? Point them at it rather than queuing a duplicate.
  const { data: existing } = await supabase
    .from('servers')
    .select('slug')
    .eq('repo_url', repoUrl)
    .maybeSingle();

  if (existing) {
    throw new ApiException('CONFLICT', 'That server is already indexed.', { slug: existing.slug });
  }

  const { error } = await supabase.from('submissions').insert({
    repo_url: repoUrl,
    submitted_by: user.id,
    notes: input.notes ?? null,
    status: 'pending',
  });

  if (error) throw new ApiException('INTERNAL', 'Could not record your submission.');

  return NextResponse.json(
    {
      ok: true,
      status: 'pending',
      message: 'Thanks — we will index this within 24 hours.',
    },
    { status: 201, headers: rateLimitHeaders(limit) },
  );
});
