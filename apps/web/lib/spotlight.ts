import { createHmac, timingSafeEqual } from 'node:crypto';

import type { ServerSecurity } from '@mcphub/shared';

import { getServerEnv } from './env';

/** How long one Spotlight purchase runs. */
export const SPOTLIGHT_DAYS = 7;

/** How many sponsors the homepage strip shows. Everyone else is on /spotlight. */
export const SPOTLIGHT_STRIP_SLOTS = 3;

/** Bid bounds, in US cents. The ceiling stops fat-finger and whale abuse. */
export const SPOTLIGHT_MIN_CENTS = 500;
export const SPOTLIGHT_MAX_CENTS = 100_000;

/** The smallest step by which a bid must beat the one above it. */
export const SPOTLIGHT_STEP_CENTS = 100;

/** Currencies a buyer can pay in: INR unlocks UPI for Indian buyers. */
export const SPOTLIGHT_CURRENCIES = ['USD', 'INR'] as const;
export type SpotlightCurrency = (typeof SPOTLIGHT_CURRENCIES)[number];

/**
 * True when every Razorpay value is configured.
 *
 * An incomplete environment reads as "closed" rather than throwing, so a
 * misconfigured deploy shows a polite notice instead of an error page.
 */
export function isSpotlightEnabled(): boolean {
  try {
    const env = getServerEnv();
    return Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET && env.RAZORPAY_WEBHOOK_SECRET);
  } catch {
    return false;
  }
}

/** The configured rupees-per-dollar rate for INR payments. */
export function getUsdInrRate(): number {
  try {
    return getServerEnv().SPOTLIGHT_USD_INR;
  } catch {
    return 85;
  }
}

/**
 * Converts a USD bid to the amount charged, in the currency's minor unit.
 *
 * Bids are always ranked in USD so the board is comparable; INR is rounded to
 * whole rupees so the price a buyer sees is a clean number.
 */
export function toChargedMinor(
  amountCents: number,
  currency: SpotlightCurrency,
  usdInr: number,
): number {
  if (currency === 'USD') return amountCents;
  return Math.round((amountCents / 100) * usdInr) * 100;
}

/** Why a server cannot be sponsored, or null when it can. */
export function spotlightIneligibility(server: {
  deprecated: boolean;
  security: ServerSecurity | null;
}): string | null {
  if (server.deprecated) return 'Deprecated servers cannot be sponsored.';

  const critical =
    (server.security?.findings ?? []).some((finding) => finding.severity === 'critical') ||
    (server.security?.dependencyAudit?.critical ?? 0) > 0;
  if (critical) return 'Servers with unresolved critical security findings cannot be sponsored.';

  return null;
}

/** Formats cents as a short US-dollar amount: 500 → "$5", 1250 → "$12.50". */
export function formatUsd(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/** What {@link createPaymentLink} needs. */
export interface PaymentLinkInput {
  amountMinor: number;
  currency: SpotlightCurrency;
  description: string;
  /** Our own id for this attempt; echoed back by Razorpay. */
  referenceId: string;
  notes: Record<string, string>;
  callbackUrl: string;
}

/**
 * Creates a Razorpay Payment Link — a hosted checkout page supporting UPI,
 * cards, netbanking and wallets in INR, and international cards in USD.
 *
 * Calls the REST API directly: it is one POST, and the official SDK would add
 * a dependency for nothing.
 */
export async function createPaymentLink(
  input: PaymentLinkInput,
): Promise<{ id: string; url: string }> {
  const env = getServerEnv();
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay is not configured');
  }

  const auth = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');

  const response = await fetch('https://api.razorpay.com/v1/payment_links', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: input.amountMinor,
      currency: input.currency,
      accept_partial: false,
      description: input.description,
      reference_id: input.referenceId,
      notes: input.notes,
      callback_url: input.callbackUrl,
      callback_method: 'get',
      // Unpaid links die after an hour so abandoned checkouts don't linger.
      expire_by: Math.floor(Date.now() / 1000) + 60 * 60,
      reminder_enable: false,
      notify: { sms: false, email: false },
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Razorpay payment link failed with ${response.status}`);
  }

  const body = (await response.json()) as { id?: string; short_url?: string };
  if (!body.id || !body.short_url) throw new Error('Razorpay returned no payment link');

  return { id: body.id, url: body.short_url };
}

/**
 * Verifies a Razorpay webhook signature: HMAC-SHA256 of the raw body with the
 * webhook secret, compared in constant time so the check leaks nothing.
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}
