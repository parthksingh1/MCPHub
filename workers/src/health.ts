import { servers } from '@mcphub/db';
import { liveStatusSchema, type LiveStatus } from '@mcphub/shared';
import { eq, sql } from 'drizzle-orm';

import { chunk, runWorker } from './lib/context';

/** How long to wait for a remote server before calling it down. */
const PROBE_TIMEOUT_MS = 8000;

/** Probes run concurrently in groups of this size. */
const CONCURRENCY = 10;

/**
 * Probes one remote MCP endpoint.
 *
 * Sends the MCP `initialize` handshake rather than a bare GET: a server can
 * return 200 from a load balancer while the MCP layer behind it is broken, and
 * reporting that as healthy is worse than not checking at all.
 *
 * A 405 or 400 still counts as up — the endpoint is reachable and speaking
 * HTTP, which is as much as a directory can honestly claim.
 */
async function probe(endpoint: string): Promise<{ isUp: boolean; responseTimeMs: number }> {
  const started = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: { name: 'mcphub-health', version: '1.0.0' },
        },
      }),
    });

    return {
      isUp: response.status < 500,
      responseTimeMs: Math.round(performance.now() - started),
    };
  } catch {
    return { isUp: false, responseTimeMs: Math.round(performance.now() - started) };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Hourly liveness check for remotely hosted servers.
 *
 * Only servers whose `live_status.isRemote` is true are probed — a stdio server
 * runs on the user's own machine and has no endpoint to check.
 */
await runWorker('health', async ({ db, log }) => {
  const rows = await db
    .select({ id: servers.id, slug: servers.slug, liveStatus: servers.liveStatus })
    .from(servers)
    .where(sql`${servers.liveStatus} ->> 'isRemote' = 'true'`);

  log.info(`probing ${rows.length} remote servers`);

  for (const batch of chunk(rows, CONCURRENCY)) {
    await Promise.all(
      batch.map(async (row) => {
        const parsed = liveStatusSchema.safeParse(row.liveStatus);

        if (!parsed.success || !parsed.data.endpoint) {
          log.count('skipped');
          return;
        }

        const result = await probe(parsed.data.endpoint);

        const liveStatus: LiveStatus = {
          ...parsed.data,
          lastCheckedAt: new Date().toISOString(),
          isUp: result.isUp,
          responseTimeMs: result.responseTimeMs,
        };

        try {
          await db.update(servers).set({ liveStatus }).where(eq(servers.id, row.id));
          log.count('updated');

          if (!result.isUp) log.info(`${row.slug} is DOWN (${parsed.data.endpoint})`);
        } catch (error) {
          log.error(`health ${row.slug}: ${error instanceof Error ? error.message : 'unknown'}`);
        }
      }),
    );
  }
});
