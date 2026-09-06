/**
 * Runs a database query, falling back to a default if it fails.
 *
 * Two situations make this necessary rather than merely defensive:
 *
 * 1. CI builds the app with no database reachable. A page that queries at build
 *    time would fail the build, so every pull request would go red for reasons
 *    unrelated to the change.
 * 2. In production a transient database blip during a redeploy would otherwise
 *    fail the deployment outright, turning a few seconds of degraded reads into
 *    an outage.
 *
 * The trade is that a page can render with empty data instead of erroring.
 * That is the right way round for a directory: an empty section is recoverable
 * on the next revalidation, a failed build is not.
 */
export async function safeQuery<T>(
  label: string,
  fallback: T,
  query: () => Promise<T>,
): Promise<T> {
  try {
    return await query();
  } catch (error) {
    console.error(`[query:${label}] failed, using fallback:`, error);
    return fallback;
  }
}
