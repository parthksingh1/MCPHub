import { NextResponse } from 'next/server';
import { z } from 'zod';

import { ApiException, parseBody, withErrorHandling } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { SITE_URL } from '@/lib/site';
import { createClient, createServiceClient } from '@/lib/supabase/server';

/** Per-user and destructive: never cached. */
export const dynamic = 'force-dynamic';

/** The caller must type this back, so a stray request cannot delete anyone. */
const CONFIRMATION = 'delete my account';

const deleteSchema = z.object({ confirm: z.literal(CONFIRMATION) }).strict();

/**
 * Rejects cross-site requests.
 *
 * The session cookie is already SameSite=Lax, which blocks the classic
 * cross-site form POST. This is a second, independent check for the one
 * endpoint where a forged request would be irreversible.
 */
function assertSameOrigin(request: Request): void {
  const origin = request.headers.get('origin');
  const expected = [new URL(SITE_URL).origin, new URL(request.url).origin];
  if (!origin || !expected.includes(origin)) {
    throw new ApiException('FORBIDDEN', 'Cross-site request rejected.');
  }
}

/**
 * `DELETE /api/me` — permanently deletes the caller's account.
 *
 * Deleting the auth user is enough: favourites and ratings cascade with it,
 * and reports and submissions keep their content but lose the link to the
 * person (`ON DELETE SET NULL`), exactly as the privacy policy describes.
 */
export const DELETE = withErrorHandling(async (request: Request) => {
  assertSameOrigin(request);
  const user = await requireUser();
  await parseBody(deleteSchema, request);

  const admin = createServiceClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) throw new ApiException('INTERNAL', 'Could not delete your account. Please try again.');

  // Clear the now-orphaned session cookie on the way out.
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: 'local' });

  return NextResponse.json(
    { deleted: true },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
});
