/**
 * Outbound HTTP with timeouts, retries, and exponential backoff.
 *
 * Every network call the crawler makes goes through here. Registries are
 * occasionally slow (the npm search endpoint routinely takes several seconds)
 * and occasionally rate-limit or 502 under load. A single failed request should
 * never end a nightly run that is otherwise doing fine, so transient failures
 * are retried and permanent ones surface immediately.
 */

/** Options for {@link fetchWithRetry}. */
export interface FetchRetryOptions extends RequestInit {
  /** Total attempts, including the first. Defaults to 3. */
  attempts?: number;
  /** Per-attempt timeout in milliseconds. Defaults to 30 seconds. */
  timeoutMs?: number;
  /** Base delay for backoff in milliseconds. Defaults to 500. */
  backoffMs?: number;
}

/** HTTP statuses worth retrying: transient server and throttling errors. */
const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

/** Sleeps for the given number of milliseconds. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches a URL, retrying transient failures with exponential backoff.
 *
 * A 4xx other than 408/425/429 is returned as-is rather than retried: the
 * request was understood and rejected, and sending it again will not change
 * that. Retrying a 404 just wastes the rate limit.
 */
export async function fetchWithRetry(
  url: string,
  options: FetchRetryOptions = {},
): Promise<Response> {
  const { attempts = 3, timeoutMs = 30_000, backoffMs = 500, ...init } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { ...init, signal: controller.signal });

      if (!RETRYABLE_STATUSES.has(response.status) || attempt === attempts) {
        return response;
      }

      // Honour Retry-After when the server tells us how long to wait.
      const retryAfter = Number.parseInt(response.headers.get('retry-after') ?? '', 10);
      const wait = Number.isFinite(retryAfter) ? retryAfter * 1000 : backoffMs * 2 ** (attempt - 1);

      await delay(Math.min(wait, 30_000));
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;

      await delay(backoffMs * 2 ** (attempt - 1));
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error(
    `Request to ${url} failed after ${attempts} attempts: ${
      lastError instanceof Error ? lastError.message : 'unknown error'
    }`,
  );
}
