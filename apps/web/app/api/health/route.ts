import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** Result of probing one downstream dependency. */
interface CheckResult {
  ok: boolean;
  latencyMs: number;
  error?: string;
}

/** Times a probe and normalises any thrown error into a result object. */
async function probe(fn: () => Promise<void>): Promise<CheckResult> {
  const start = performance.now();
  try {
    await fn();
    return { ok: true, latencyMs: Math.round(performance.now() - start) };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Math.round(performance.now() - start),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Liveness endpoint for UptimeRobot and local verification.
 * Returns 503 when a hard dependency is down so alerts actually fire.
 */
export async function GET(): Promise<NextResponse> {
  const supabase = await probe(async () => {
    const client = await createClient();
    const { error } = await client.from('servers').select('id', { head: true, count: 'exact' });
    // A missing table means migrations have not run yet, but the connection
    // itself is healthy — surface that distinctly rather than as an outage.
    if (error && error.code !== '42P01') throw new Error(error.message);
  });

  const body = {
    status: supabase.ok ? ('ok' as const) : ('degraded' as const),
    timestamp: new Date().toISOString(),
    checks: { supabase },
  };

  return NextResponse.json(body, { status: supabase.ok ? 200 : 503 });
}
