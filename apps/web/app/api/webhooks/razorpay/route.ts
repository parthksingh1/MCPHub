import { getDatabase, sponsorships } from '@mcphub/db';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getServerEnv } from '@/lib/env';
import { SPOTLIGHT_DAYS, verifyWebhookSignature } from '@/lib/spotlight';

export const dynamic = 'force-dynamic';

/** The slice of a `payment_link.paid` event this handler reads. */
const paidEventSchema = z.object({
  event: z.literal('payment_link.paid'),
  payload: z.object({
    payment_link: z.object({ entity: z.object({ id: z.string() }) }),
    payment: z.object({
      entity: z.object({
        id: z.string(),
        amount: z.number().int(),
        currency: z.string(),
        email: z.string().nullish(),
      }),
    }),
  }),
});

/**
 * `POST /api/webhooks/razorpay` — activates a placement once payment clears.
 *
 * The signature check is the whole of the security here: without it, anyone
 * could POST a fake "paid" event. The paid amount must also match what we
 * charged, and the update is conditional on `pending`, so Razorpay's
 * at-least-once redelivery can never extend a placement twice.
 */
export async function POST(request: Request): Promise<Response> {
  let secret: string | undefined;
  try {
    secret = getServerEnv().RAZORPAY_WEBHOOK_SECRET;
  } catch {
    secret = undefined;
  }
  const signature = request.headers.get('x-razorpay-signature');
  if (!secret || !signature) return new NextResponse('Not configured', { status: 400 });

  // Signature verification needs the exact raw bytes, not re-serialised JSON.
  const payload = await request.text();
  if (!verifyWebhookSignature(payload, signature, secret)) {
    return new NextResponse('Invalid signature', { status: 400 });
  }

  let json: unknown;
  try {
    json = JSON.parse(payload);
  } catch {
    return new NextResponse('Bad payload', { status: 400 });
  }

  const parsed = paidEventSchema.safeParse(json);
  if (parsed.success) {
    const link = parsed.data.payload.payment_link.entity;
    const payment = parsed.data.payload.payment.entity;
    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + SPOTLIGHT_DAYS * 24 * 60 * 60 * 1000);

    await getDatabase()
      .update(sponsorships)
      .set({
        status: 'active',
        startsAt,
        endsAt,
        paymentId: payment.id,
        email: payment.email ?? null,
      })
      .where(
        and(
          eq(sponsorships.provider, 'razorpay'),
          eq(sponsorships.providerRef, link.id),
          eq(sponsorships.status, 'pending'),
          eq(sponsorships.chargedMinor, payment.amount),
          eq(sponsorships.currency, payment.currency.toUpperCase()),
        ),
      );
  }

  // Acknowledge every verified event, handled or not, so Razorpay stops retrying.
  return NextResponse.json({ received: true });
}
