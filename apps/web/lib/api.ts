import type { ApiErrorCode } from '@mcphub/shared';
import { NextResponse } from 'next/server';
import { ZodError, type ZodTypeAny, type z } from 'zod';

/** Maps each error code to the HTTP status it should be returned with. */
const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL: 500,
  UPSTREAM_UNAVAILABLE: 503,
};

/**
 * An error that carries the code and status the API should return.
 * Anything else thrown from a handler is treated as an unexpected 500.
 */
export class ApiException extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiException';
  }
}

/** Builds the uniform error envelope every route returns on failure. */
export function errorResponse(
  code: ApiErrorCode,
  message: string,
  details?: unknown,
  headers?: HeadersInit,
): NextResponse {
  return NextResponse.json(
    { error: { code, message, ...(details === undefined ? {} : { details }) } },
    { status: STATUS_BY_CODE[code], headers },
  );
}

/**
 * Builds a successful JSON response with cache headers.
 *
 * `s-maxage` is what Vercel's edge and Cloudflare actually honour;
 * `stale-while-revalidate` lets them keep serving during a revalidation, which
 * is the single most effective thing standing between a launch-day spike and
 * the origin.
 */
export function jsonResponse<T>(
  data: T,
  options: { sMaxAge?: number; staleWhileRevalidate?: number; headers?: HeadersInit } = {},
): NextResponse {
  const { sMaxAge = 60, staleWhileRevalidate = 600 } = options;

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': `public, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
      ...options.headers,
    },
  });
}

/**
 * Parses and validates query parameters against a Zod schema.
 *
 * Generic over the schema rather than over a result type: `ZodSchema<T>` fixes
 * the input and output types to the same `T`, which silently types a field
 * with a `.default()` as optional even though parsing always supplies it.
 * `z.infer<S>` reads the true output type.
 *
 * Repeated params (`?category=a&category=b`) are collected into arrays before
 * validation, because `Object.fromEntries` on `URLSearchParams` silently keeps
 * only the last value — which would make multi-select filters quietly wrong.
 */
export function parseQuery<S extends ZodTypeAny>(schema: S, url: URL): z.infer<S> {
  const raw: Record<string, string | string[]> = {};

  for (const key of new Set(url.searchParams.keys())) {
    const values = url.searchParams.getAll(key);
    raw[key] = values.length > 1 ? values : (values[0] as string);
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ApiException(
      'BAD_REQUEST',
      'Invalid query parameters',
      flattenZodError(result.error),
    );
  }

  return result.data;
}

/** Parses and validates a JSON request body against a Zod schema. */
export async function parseBody<S extends ZodTypeAny>(
  schema: S,
  request: Request,
): Promise<z.infer<S>> {
  let raw: unknown;

  try {
    raw = await request.json();
  } catch {
    throw new ApiException('BAD_REQUEST', 'Request body must be valid JSON');
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ApiException('BAD_REQUEST', 'Invalid request body', flattenZodError(result.error));
  }

  return result.data;
}

/** Reduces a Zod error to a field-keyed map of messages. */
function flattenZodError(error: ZodError): Record<string, string[]> {
  const fields: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_';
    (fields[path] ??= []).push(issue.message);
  }

  return fields;
}

/**
 * Wraps a route handler with the shared error boundary.
 *
 * Expected failures surface as their declared code; anything else becomes a
 * generic 500 whose message is never echoed back to the caller, because an
 * unhandled database error routinely contains a connection string.
 */
export function withErrorHandling<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<NextResponse>,
): (...args: TArgs) => Promise<NextResponse> {
  return async (...args: TArgs): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof ApiException) {
        return errorResponse(error.code, error.message, error.details);
      }

      if (error instanceof ZodError) {
        return errorResponse('BAD_REQUEST', 'Validation failed', flattenZodError(error));
      }

      console.error('[api] unhandled error:', error);
      return errorResponse('INTERNAL', 'Something went wrong on our end.');
    }
  };
}

/**
 * Best-effort client IP, used only as a rate-limit key.
 *
 * `x-forwarded-for` is spoofable in general, but on Vercel behind Cloudflare
 * the left-most entry is set by the edge. Falling back to a constant means an
 * unidentifiable caller shares one bucket, which fails closed rather than
 * handing anonymous traffic an unlimited allowance.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  return request.headers.get('x-real-ip') ?? 'unknown';
}
