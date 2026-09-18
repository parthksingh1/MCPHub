import { createHmac } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  formatUsd,
  spotlightIneligibility,
  toChargedMinor,
  verifyWebhookSignature,
} from './spotlight';

const clean = {
  lastScanAt: null,
  scanned: true,
  skipReason: null,
  findings: [],
};

describe('spotlightIneligibility', () => {
  it('allows a healthy server', () => {
    expect(spotlightIneligibility({ deprecated: false, security: clean })).toBeNull();
  });

  it('allows an unscanned server', () => {
    expect(spotlightIneligibility({ deprecated: false, security: null })).toBeNull();
  });

  it('rejects deprecated servers', () => {
    expect(spotlightIneligibility({ deprecated: true, security: clean })).toMatch(/deprecated/i);
  });

  it('rejects critical code findings', () => {
    const security = {
      ...clean,
      findings: [{ ruleId: 'x', severity: 'critical' as const, message: 'bad' }],
    };
    expect(spotlightIneligibility({ deprecated: false, security })).toMatch(/critical/i);
  });

  it('rejects critical dependency advisories', () => {
    const security = {
      ...clean,
      dependencyAudit: {
        tool: 'npm-audit' as const,
        critical: 1,
        high: 0,
        medium: 0,
        low: 0,
        total: 1,
      },
    };
    expect(spotlightIneligibility({ deprecated: false, security })).toMatch(/critical/i);
  });
});

describe('formatUsd', () => {
  it('drops cents for whole dollars', () => {
    expect(formatUsd(500)).toBe('$5');
    expect(formatUsd(123_400)).toBe('$1,234');
  });

  it('keeps cents otherwise', () => {
    expect(formatUsd(1250)).toBe('$12.50');
  });
});

describe('toChargedMinor', () => {
  it('charges USD bids as-is', () => {
    expect(toChargedMinor(1000, 'USD', 85)).toBe(1000);
  });

  it('converts to whole rupees in paise', () => {
    expect(toChargedMinor(1000, 'INR', 85)).toBe(85_000);
    expect(toChargedMinor(500, 'INR', 83.37)).toBe(41_700);
  });
});

describe('verifyWebhookSignature', () => {
  const secret = 'whsec_test';
  const body = '{"event":"payment_link.paid"}';
  const valid = createHmac('sha256', secret).update(body).digest('hex');

  it('accepts a correct signature', () => {
    expect(verifyWebhookSignature(body, valid, secret)).toBe(true);
  });

  it('rejects a tampered body, wrong secret, or garbage', () => {
    expect(verifyWebhookSignature(`${body} `, valid, secret)).toBe(false);
    expect(verifyWebhookSignature(body, valid, 'other')).toBe(false);
    expect(verifyWebhookSignature(body, 'nope', secret)).toBe(false);
  });
});
