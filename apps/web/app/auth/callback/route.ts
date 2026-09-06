import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GitHub OAuth callback.
 *
 * Exchanges the authorisation code for a session and sets the auth cookies.
 *
 * The `next` parameter is deliberately restricted to same-origin paths: taking
 * an arbitrary URL from the query string and redirecting to it after login is
 * a textbook open-redirect, and it is exactly the kind of thing an attacker
 * chains with a phishing page.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const requested = url.searchParams.get('next') ?? '/dashboard';

  const next = requested.startsWith('/') && !requested.startsWith('//') ? requested : '/dashboard';

  if (!code) {
    return NextResponse.redirect(new URL('/?auth=missing_code', url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL('/?auth=failed', url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
