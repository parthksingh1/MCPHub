import { describe, expect, it } from 'vitest';

import {
  computeMaintenance,
  computePopularity,
  computeQuality,
  computeSecurity,
  computeTrustScore,
} from '../compute';
import type { ScoringInput } from '../types';

/** Fixed clock so recency assertions never depend on the wall clock. */
const NOW = new Date('2026-06-01T00:00:00.000Z');

/** Returns an ISO timestamp exactly `days` before {@link NOW}. */
function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 86_400_000).toISOString();
}

/** A server with no redeeming qualities, used as the base for every case. */
function baseInput(overrides: Partial<ScoringInput> = {}): ScoringInput {
  return {
    lastCommitAt: null,
    lastReleaseAt: null,
    openIssues: 0,
    stars: 0,
    isOfficial: false,
    npmWeeklyDownloads: null,
    security: null,
    quality: {
      readmeLength: 0,
      hasLicense: false,
      hasTypes: false,
      hasTests: false,
      hasCi: false,
    },
    ...overrides,
  };
}

describe('computeMaintenance', () => {
  it('awards 15 for a commit within 30 days', () => {
    expect(computeMaintenance(baseInput({ lastCommitAt: daysAgo(10) }), NOW)).toBe(15);
  });

  it('awards 15 exactly at the 30-day boundary', () => {
    expect(computeMaintenance(baseInput({ lastCommitAt: daysAgo(30) }), NOW)).toBe(15);
  });

  it('awards 10 for a commit within 90 days', () => {
    expect(computeMaintenance(baseInput({ lastCommitAt: daysAgo(60) }), NOW)).toBe(10);
  });

  it('awards 10 exactly at the 90-day boundary', () => {
    expect(computeMaintenance(baseInput({ lastCommitAt: daysAgo(90) }), NOW)).toBe(10);
  });

  it('awards 5 for a commit within 180 days', () => {
    expect(computeMaintenance(baseInput({ lastCommitAt: daysAgo(120) }), NOW)).toBe(5);
  });

  it('awards 5 exactly at the 180-day boundary', () => {
    expect(computeMaintenance(baseInput({ lastCommitAt: daysAgo(180) }), NOW)).toBe(5);
  });

  it('awards nothing for a commit older than 180 days', () => {
    expect(computeMaintenance(baseInput({ lastCommitAt: daysAgo(400) }), NOW)).toBe(0);
  });

  it('awards nothing when the commit date is missing', () => {
    expect(computeMaintenance(baseInput({ lastCommitAt: null }), NOW)).toBe(0);
  });

  it('awards nothing when the commit date is unparseable', () => {
    expect(computeMaintenance(baseInput({ lastCommitAt: 'not-a-date' }), NOW)).toBe(0);
  });

  it('adds 10 for a release within 90 days', () => {
    const input = baseInput({ lastCommitAt: daysAgo(5), lastReleaseAt: daysAgo(30) });
    expect(computeMaintenance(input, NOW)).toBe(25);
  });

  it('ignores a release older than 90 days', () => {
    const input = baseInput({ lastCommitAt: daysAgo(5), lastReleaseAt: daysAgo(200) });
    expect(computeMaintenance(input, NOW)).toBe(15);
  });

  it('ignores a missing release date', () => {
    const input = baseInput({ lastCommitAt: daysAgo(5), lastReleaseAt: null });
    expect(computeMaintenance(input, NOW)).toBe(15);
  });

  it('ignores an unparseable release date', () => {
    const input = baseInput({ lastCommitAt: daysAgo(5), lastReleaseAt: 'nonsense' });
    expect(computeMaintenance(input, NOW)).toBe(15);
  });

  it('penalises many open issues on a stale repo', () => {
    const input = baseInput({ lastCommitAt: daysAgo(200), openIssues: 80 });
    expect(computeMaintenance(input, NOW)).toBe(0);
  });

  it('penalises many open issues when the commit date is unknown', () => {
    const input = baseInput({ lastCommitAt: null, openIssues: 80, lastReleaseAt: daysAgo(10) });
    // 10 for the recent release, minus the 5-point stale-issues penalty.
    expect(computeMaintenance(input, NOW)).toBe(5);
  });

  it('does not penalise many open issues on an actively maintained repo', () => {
    const input = baseInput({ lastCommitAt: daysAgo(5), openIssues: 500 });
    expect(computeMaintenance(input, NOW)).toBe(15);
  });

  it('does not penalise a stale repo with few open issues', () => {
    const input = baseInput({ lastCommitAt: daysAgo(120), openIssues: 3 });
    expect(computeMaintenance(input, NOW)).toBe(5);
  });

  it('never returns a negative score', () => {
    const input = baseInput({ lastCommitAt: daysAgo(999), openIssues: 900 });
    expect(computeMaintenance(input, NOW)).toBe(0);
  });

  it('never exceeds 25', () => {
    const input = baseInput({ lastCommitAt: daysAgo(1), lastReleaseAt: daysAgo(1) });
    expect(computeMaintenance(input, NOW)).toBe(25);
  });
});

describe('computePopularity', () => {
  it('scores zero stars as zero', () => {
    expect(computePopularity(baseInput({ stars: 0 }), NOW)).toBe(0);
  });

  it('scales stars logarithmically', () => {
    // floor(log10(101) * 6) = floor(12.03) = 12
    expect(computePopularity(baseInput({ stars: 100 }), NOW)).toBe(12);
    // floor(log10(1001) * 6) = floor(18.01) = 18
    expect(computePopularity(baseInput({ stars: 1000 }), NOW)).toBe(18);
  });

  it('caps the star component at 25 for very popular repos', () => {
    expect(computePopularity(baseInput({ stars: 10_000_000 }), NOW)).toBe(25);
  });

  it('treats a negative star count as zero rather than producing NaN', () => {
    expect(computePopularity(baseInput({ stars: -5 }), NOW)).toBe(0);
  });

  it('adds 5 for an official server', () => {
    expect(computePopularity(baseInput({ stars: 100, isOfficial: true }), NOW)).toBe(17);
  });

  it('adds 3 for more than 1000 weekly npm downloads', () => {
    const input = baseInput({ stars: 100, npmWeeklyDownloads: 5000 });
    expect(computePopularity(input, NOW)).toBe(15);
  });

  it('does not add the download bonus at exactly 1000 downloads', () => {
    const input = baseInput({ stars: 100, npmWeeklyDownloads: 1000 });
    expect(computePopularity(input, NOW)).toBe(12);
  });

  it('treats missing download counts as zero', () => {
    const input = baseInput({ stars: 100, npmWeeklyDownloads: null });
    expect(computePopularity(input, NOW)).toBe(12);
  });

  it('clamps the total to 25 once bonuses are applied', () => {
    const input = baseInput({ stars: 500_000, isOfficial: true, npmWeeklyDownloads: 90_000 });
    expect(computePopularity(input, NOW)).toBe(25);
  });
});

describe('computeSecurity', () => {
  it('gives an unscanned server the full 25', () => {
    expect(computeSecurity(baseInput({ security: null }), NOW)).toBe(25);
  });

  it('gives a clean scan the full 25', () => {
    const input = baseInput({ security: { findings: [], dependencyAudit: undefined } });
    expect(computeSecurity(input, NOW)).toBe(25);
  });

  it('zeroes the score on a single critical finding', () => {
    const input = baseInput({
      security: {
        findings: [{ ruleId: 'r', severity: 'critical', message: 'command injection' }],
        dependencyAudit: undefined,
      },
    });
    expect(computeSecurity(input, NOW)).toBe(0);
  });

  it('subtracts 10 per high finding', () => {
    const input = baseInput({
      security: {
        findings: [{ ruleId: 'r', severity: 'high', message: 'eval' }],
        dependencyAudit: undefined,
      },
    });
    expect(computeSecurity(input, NOW)).toBe(15);
  });

  it('subtracts 5 per medium finding', () => {
    const input = baseInput({
      security: {
        findings: [{ ruleId: 'r', severity: 'medium', message: 'cors' }],
        dependencyAudit: undefined,
      },
    });
    expect(computeSecurity(input, NOW)).toBe(20);
  });

  it('subtracts 2 per low finding', () => {
    const input = baseInput({
      security: {
        findings: [{ ruleId: 'r', severity: 'low', message: 'nit' }],
        dependencyAudit: undefined,
      },
    });
    expect(computeSecurity(input, NOW)).toBe(23);
  });

  it('does not penalise informational findings', () => {
    const input = baseInput({
      security: {
        findings: [{ ruleId: 'r', severity: 'info', message: 'fyi' }],
        dependencyAudit: undefined,
      },
    });
    expect(computeSecurity(input, NOW)).toBe(25);
  });

  it('accumulates multiple findings', () => {
    const input = baseInput({
      security: {
        findings: [
          { ruleId: 'a', severity: 'high', message: 'x' },
          { ruleId: 'b', severity: 'medium', message: 'y' },
          { ruleId: 'c', severity: 'low', message: 'z' },
        ],
        dependencyAudit: undefined,
      },
    });
    expect(computeSecurity(input, NOW)).toBe(8);
  });

  it('penalises dependency advisories by severity', () => {
    const input = baseInput({
      security: {
        findings: [],
        dependencyAudit: {
          tool: 'npm-audit',
          critical: 1,
          high: 1,
          medium: 1,
          low: 9,
          total: 12,
        },
      },
    });
    // 25 - 10 (critical) - 5 (high) - 2 (medium); low advisories are not penalised.
    expect(computeSecurity(input, NOW)).toBe(8);
  });

  it('floors the score at zero rather than going negative', () => {
    const input = baseInput({
      security: {
        findings: [
          { ruleId: 'a', severity: 'critical', message: 'x' },
          { ruleId: 'b', severity: 'critical', message: 'y' },
        ],
        dependencyAudit: { tool: 'npm-audit', critical: 5, high: 5, medium: 5, low: 0, total: 15 },
      },
    });
    expect(computeSecurity(input, NOW)).toBe(0);
  });
});

describe('computeQuality', () => {
  it('scores a bare repo as zero', () => {
    expect(computeQuality(baseInput(), NOW)).toBe(0);
  });

  it('awards 5 for a substantial README', () => {
    const input = baseInput({ quality: { ...baseInput().quality, readmeLength: 501 } });
    expect(computeQuality(input, NOW)).toBe(5);
  });

  it('does not award the README point at exactly 500 characters', () => {
    const input = baseInput({ quality: { ...baseInput().quality, readmeLength: 500 } });
    expect(computeQuality(input, NOW)).toBe(0);
  });

  it('awards 5 for a licence', () => {
    const input = baseInput({ quality: { ...baseInput().quality, hasLicense: true } });
    expect(computeQuality(input, NOW)).toBe(5);
  });

  it('awards 5 for type annotations', () => {
    const input = baseInput({ quality: { ...baseInput().quality, hasTypes: true } });
    expect(computeQuality(input, NOW)).toBe(5);
  });

  it('awards 5 for tests', () => {
    const input = baseInput({ quality: { ...baseInput().quality, hasTests: true } });
    expect(computeQuality(input, NOW)).toBe(5);
  });

  it('awards 5 for CI', () => {
    const input = baseInput({ quality: { ...baseInput().quality, hasCi: true } });
    expect(computeQuality(input, NOW)).toBe(5);
  });

  it('awards the full 25 when every signal is present', () => {
    const input = baseInput({
      quality: {
        readmeLength: 5000,
        hasLicense: true,
        hasTypes: true,
        hasTests: true,
        hasCi: true,
      },
    });
    expect(computeQuality(input, NOW)).toBe(25);
  });
});

describe('computeTrustScore', () => {
  it('sums the four components into the total', () => {
    const input = baseInput({
      lastCommitAt: daysAgo(5),
      lastReleaseAt: daysAgo(5),
      stars: 1000,
      quality: {
        readmeLength: 5000,
        hasLicense: true,
        hasTypes: true,
        hasTests: true,
        hasCi: true,
      },
    });

    const score = computeTrustScore(input, { now: NOW });

    expect(score).toEqual({
      maintenance: 25,
      popularity: 18,
      security: 25,
      quality: 25,
      total: 93,
    });
  });

  it('scores an abandoned, vulnerable, undocumented server at the floor', () => {
    const input = baseInput({
      lastCommitAt: daysAgo(800),
      openIssues: 200,
      security: {
        findings: [{ ruleId: 'a', severity: 'critical', message: 'rce' }],
        dependencyAudit: undefined,
      },
    });

    const score = computeTrustScore(input, { now: NOW });

    expect(score).toEqual({
      maintenance: 0,
      popularity: 0,
      security: 0,
      quality: 0,
      total: 0,
    });
  });

  it('never exceeds 100 even for a perfect server', () => {
    const input = baseInput({
      lastCommitAt: daysAgo(1),
      lastReleaseAt: daysAgo(1),
      stars: 1_000_000,
      isOfficial: true,
      npmWeeklyDownloads: 1_000_000,
      security: { findings: [], dependencyAudit: undefined },
      quality: {
        readmeLength: 9000,
        hasLicense: true,
        hasTypes: true,
        hasTests: true,
        hasCi: true,
      },
    });

    expect(computeTrustScore(input, { now: NOW }).total).toBe(100);
  });

  it('defaults to the current time when no clock is injected', () => {
    const input = baseInput({ lastCommitAt: new Date().toISOString() });
    expect(computeTrustScore(input).maintenance).toBe(15);
  });
});
