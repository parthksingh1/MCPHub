import { z } from 'zod';

/**
 * An optional variable that may legitimately be present but blank.
 *
 * `.env` files commonly carry `SENTRY_DSN=""` as a placeholder. Zod treats an
 * empty string as *present*, so a bare `.optional()` would still fail `.min(1)`.
 * Normalising '' to undefined first is what makes "unset" and "set to empty"
 * mean the same thing.
 */
const optionalString = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().min(1).optional(),
);

/**
 * An optional URL that may legitimately be present but blank.
 */
const optionalUrl = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().url().optional(),
);

/**
 * Server-side environment contract. Parsed lazily so that a missing optional
 * integration (Sentry, Resend, PostHog) never breaks local development, while
 * a missing required one fails loudly at first use rather than silently at 3am.
 */
const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  DATABASE_URL: optionalString,
  UPSTASH_REDIS_REST_URL: optionalUrl,
  UPSTASH_REDIS_REST_TOKEN: optionalString,
  RESEND_API_KEY: optionalString,
  SENTRY_DSN: optionalString,
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  LAUNCH_MODE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

/**
 * Validates and returns server environment variables, caching the result.
 * Throws a readable error listing every missing or malformed variable.
 */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${issues}\n\nSee .env.example.`);
  }

  cached = parsed.data;
  return cached;
}

/** True when the launch-day kill switch is on. */
export function isLaunchMode(): boolean {
  return process.env.LAUNCH_MODE === 'true';
}
