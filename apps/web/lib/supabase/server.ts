import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

import { getServerEnv } from '../env';

/**
 * Supabase client for Server Components, Route Handlers, and Server Actions.
 * Reads and refreshes the auth session from cookies, so RLS sees the real user.
 */
export async function createClient(): Promise<SupabaseClient> {
  const env = getServerEnv();
  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Middleware refreshes the session instead; nothing to do here.
        }
      },
    },
  });
}

/**
 * Service-role client. Bypasses RLS entirely — use only in trusted server
 * paths (workers, admin routes) and never expose its results unfiltered.
 */
export function createServiceClient(): SupabaseClient {
  const env = getServerEnv();

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for service-role access');
  }

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    cookies: { getAll: () => [], setAll: () => undefined },
  });
}
