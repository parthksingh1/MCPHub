import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Refreshes the Supabase auth session on every request.
 *
 * This is not optional with `@supabase/ssr`. Access tokens are short-lived,
 * and only a Server Component or middleware can write the refreshed cookie
 * back to the browser. Server Components cannot set cookies during render, so
 * without this middleware a session silently expires: the user still looks
 * signed in on the client, every server-side check starts failing, and writes
 * begin returning 401 for no visible reason.
 *
 * `getUser()` is what triggers the refresh — it validates the token against
 * the auth server, unlike `getSession()`, which only decodes the cookie and so
 * neither verifies nor renews anything.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // A misconfigured deployment should still serve pages rather than 500 on
  // every route; the app degrades to signed-out.
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  try {
    await supabase.auth.getUser();
  } catch {
    // An auth-server outage must not take the whole site down. Reads are
    // public; only writes need a session, and those fail closed on their own.
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Every path except static assets and image optimisation. Running this on
     * `_next/static` would add an auth round-trip to every chunk request for
     * no benefit.
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)',
  ],
};
