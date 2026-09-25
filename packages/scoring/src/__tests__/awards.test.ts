import { describe, expect, it } from 'vitest';

import {
  AWARD_IDS,
  AWARDS,
  computeAwards,
  isScanClean,
  popularTier,
  type AwardInput,
} from '../awards';

const NOW = new Date('2026-09-19T00:00:00Z');
const daysAgo = (days: number): string => new Date(NOW.getTime() - days * 86_400_000).toISOString();

const cleanScan = {
  scanned: true,
  lastScanAt: daysAgo(3),
  findings: [{ severity: 'low' }],
  dependencyAudit: { critical: 0, high: 0 },
};

/** A server that earns every automatic badge. */
const best: AwardInput = {
  trustTotal: 95,
  trustPrevious: 88,
  lastCommitAt: daysAgo(2),
  license: 'MIT',
  githubStars: 5000,
  isOfficial: true,
  verified: true,
  deprecated: false,
  scanClean: true,
};

describe('isScanClean', () => {
  it('accepts a current scan with only low findings', () => {
    expect(isScanClean(cleanScan, NOW)).toBe(true);
  });

  it('accepts a scan with no dependency audit', () => {
    expect(isScanClean({ ...cleanScan, dependencyAudit: undefined }, NOW)).toBe(true);
  });

  it('never treats a missing or unscanned result as clean', () => {
    expect(isScanClean(null, NOW)).toBe(false);
    expect(isScanClean({ ...cleanScan, scanned: false }, NOW)).toBe(false);
  });

  it('rejects stale or undated scans', () => {
    expect(isScanClean({ ...cleanScan, lastScanAt: daysAgo(61) }, NOW)).toBe(false);
    expect(isScanClean({ ...cleanScan, lastScanAt: null }, NOW)).toBe(false);
    expect(isScanClean({ ...cleanScan, lastScanAt: 'not a date' }, NOW)).toBe(false);
  });

  it('rejects critical or high code findings', () => {
    expect(isScanClean({ ...cleanScan, findings: [{ severity: 'high' }] }, NOW)).toBe(false);
    expect(isScanClean({ ...cleanScan, findings: [{ severity: 'critical' }] }, NOW)).toBe(false);
  });

  it('rejects vulnerable dependencies', () => {
    expect(isScanClean({ ...cleanScan, dependencyAudit: { critical: 0, high: 1 } }, NOW)).toBe(
      false,
    );
  });

  it('uses the current time by default', () => {
    expect(isScanClean({ ...cleanScan, lastScanAt: new Date().toISOString() })).toBe(true);
  });
});

describe('computeAwards', () => {
  it('awards everything to a server that meets every rule, in display order', () => {
    expect(computeAwards(best, NOW)).toEqual([...AWARD_IDS]);
  });

  it('awards nothing to an unremarkable server', () => {
    expect(
      computeAwards(
        {
          ...best,
          trustTotal: 40,
          trustPrevious: null,
          lastCommitAt: null,
          githubStars: 3,
          isOfficial: false,
          verified: false,
          scanClean: false,
        },
        NOW,
      ),
    ).toEqual([]);
  });

  it('keeps only the factual official marker once deprecated', () => {
    expect(computeAwards({ ...best, deprecated: true }, NOW)).toEqual(['official']);
  });

  it('withholds trusted without a clean scan, even at a perfect score', () => {
    const awards = computeAwards({ ...best, trustTotal: 100, scanClean: false }, NOW);
    expect(awards).not.toContain('trusted');
    expect(awards).toContain('top-rated');
  });

  it('withholds trusted below the score threshold', () => {
    expect(computeAwards({ ...best, trustTotal: 79 }, NOW)).not.toContain('trusted');
  });

  it('withholds trusted from stale projects but keeps it within 90 days', () => {
    expect(computeAwards({ ...best, lastCommitAt: daysAgo(91) }, NOW)).not.toContain('trusted');
    const recent = computeAwards({ ...best, lastCommitAt: daysAgo(60) }, NOW);
    expect(recent).toContain('trusted');
    expect(recent).not.toContain('maintained');
  });

  it('withholds trusted without a licence', () => {
    expect(computeAwards({ ...best, license: null }, NOW)).not.toContain('trusted');
    expect(computeAwards({ ...best, license: '  ' }, NOW)).not.toContain('trusted');
  });

  it('awards rising only for a gain of five or more', () => {
    expect(computeAwards({ ...best, trustPrevious: 91 }, NOW)).not.toContain('rising');
    expect(computeAwards({ ...best, trustPrevious: 90 }, NOW)).toContain('rising');
  });

  it('accepts Date objects and uses the current time by default', () => {
    expect(computeAwards({ ...best, lastCommitAt: new Date() })).toContain('maintained');
  });

  it('publishes a definition for every badge', () => {
    for (const id of AWARD_IDS) {
      expect(AWARDS[id].id).toBe(id);
      expect(AWARDS[id].criteria.length).toBeGreaterThan(10);
    }
  });
});

describe('popularTier', () => {
  it('levels up with stars', () => {
    expect(popularTier(999)).toBeNull();
    expect(popularTier(1000)).toBe('bronze');
    expect(popularTier(10_000)).toBe('silver');
    expect(popularTier(50_000)).toBe('gold');
  });
});
