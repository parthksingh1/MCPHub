import { randomUUID } from 'node:crypto';

import { getDatabase, sponsorships } from '@mcphub/db';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { ApiException, errorResponse, getClientIp, parseBody, withErrorHandling } from '@/lib/api';
import { getServerBySlug } from '@/lib/queries/servers';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';
import { SITE_URL } from '@/lib/site';
import {
  SPOTLIGHT_CURRENCIES,
  SPOTLIGHT_DAYS,
  SPOTLIGHT_MAX_CENTS,
  SPOTLIGHT_MIN_CENTS,
  createPaymentLink,
  getUsdInrRate,
  isSpotlightEnabled,
  spotlightIneligibility,
  toChargedMinor,
} from '@/lib/spotlight';

export const dynamic = 'force-dynamic';

const checkoutSchema = z
  .object({
    slug: z.string().min(1).max(120),
    /** Whole US dollars keeps the form simple and the amounts legible. */
    amountCents: z
      .number()
      .int()
      .min(SPOTLIGHT_MIN_CENTS)
      .max(SPOTLIGHT_MAX_CENTS)
      .refine((cents) => cents % 100 === 0, 'Bids are in whole dollars.'),
    currency: z.enum(SPOTLIGHT_CURRENCIES),
    /** Buyer confirms they maintain the server or have permission. */
    authorised: z.literal(true),
  })
  .strict();

/**
 * `POST /api/spotlight/checkout` — issues a Razorpay payment link.
 *
 * The charged amount is computed server-side from the validated bid, and the
 * row stays `pending` until the signed webhook confirms payment — a redirect
 * back to the callback URL proves nothing.
 */
export const POST = withErrorHandling(async (request: Request) => {
  if (!isSpotlightEnabled()) {
    throw new ApiException('UPSTREAM_UNAVAILABLE', 'Spotlight is not open yet.');
  }

  const limit = await checkRateLimit('write', getClientIp(request));
  if (!limit.success) {
    return errorResponse(
      'RATE_LIMITED',
      'Too many attempts. Please wait a minute.',
      undefined,
      rateLimitHeaders(limit),
    );
  }

  const input = await parseBody(checkoutSchema, request);

  const server = await getServerBySlug(input.slug);
  if (!server) throw new ApiException('NOT_FOUND', 'No server with that slug is indexed.');

  const reason = spotlightIneligibility(server);
  if (reason) throw new ApiException('BAD_REQUEST', reason);

  const chargedMinor = toChargedMinor(input.amountCents, input.currency, getUsdInrRate());
  // Razorpay caps reference ids at 40 characters; a UUID without dashes fits.
  const referenceId = randomUUID().replace(/-/g, '');

  let link: { id: string; url: string };
  try {
    link = await createPaymentLink({
      amountMinor: chargedMinor,
      currency: input.currency,
      description: `MCPHub Spotlight — ${server.name} (${SPOTLIGHT_DAYS} days, sponsored)`.slice(
        0,
        2048,
      ),
      referenceId,
      notes: { serverId: server.id, slug: server.slug },
      callbackUrl: `${SITE_URL}/spotlight?status=success`,
    });
  } catch {
    throw new ApiException(
      'UPSTREAM_UNAVAILABLE',
      'The payment provider is unavailable. Please try again.',
    );
  }

  await getDatabase().insert(sponsorships).values({
    serverId: server.id,
    amountCents: input.amountCents,
    currency: input.currency,
    chargedMinor,
    provider: 'razorpay',
    providerRef: link.id,
  });

  return NextResponse.json({ url: link.url }, { headers: { 'Cache-Control': 'no-store' } });
});
