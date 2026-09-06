import type { User } from '@supabase/supabase-js';

import { ApiException } from './api';
import { createClient } from './supabase/server';

/**
 * Returns the signed-in user, or null.
 *
 * Uses `getUser()` rather than `getSession()`: `getSession` reads the cookie
 * without verifying it against the auth server, so it can be forged. Anything
 * that gates a write must use the verified call.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) return null;
  return data.user ?? null;
}

/** Returns the signed-in user, or throws a 401. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new ApiException('UNAUTHORIZED', 'You must be signed in to do that.');

  return user;
}

/**
 * True when the user carries the admin claim.
 *
 * Read from `app_metadata`, which only the service role can write — unlike
 * `user_metadata`, which the user can set themselves. The same claim backs the
 * `public.is_admin()` function that RLS policies call, so the API and the
 * database agree on who is an admin by construction.
 */
export function isAdmin(user: User | null): boolean {
  return user?.app_metadata?.is_admin === true;
}

/** Returns the signed-in user if they are an admin, or throws. */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (!isAdmin(user)) throw new ApiException('FORBIDDEN', 'Administrator access required.');

  return user;
}
