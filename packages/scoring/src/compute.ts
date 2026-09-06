import { TRUST_MAX_COMPONENT, type Severity, type TrustScore } from '@mcphub/shared';

import type { ScoringInput, ScoringOptions } from './types';

/** Milliseconds in a day, for readable recency thresholds. */
const DAY_MS = 86_400_000;

/** Penalty applied to the security score per finding severity. */
const FINDING_PENALTY: Record<Severity, number> = {
  critical: 25,
  high: 10,
  medium: 5,
  low: 2,
  info: 0,
};

/** Penalty applied per dependency advisory severity. */
const DEPENDENCY_PENALTY = {
  critical: 10,
  high: 5,
  medium: 2,
} as const;

/** Clamps a value into the valid 0-25 range for a Trust Score component. */
function clampComponent(value: number): number {
  return Math.max(0, Math.min(TRUST_MAX_COMPONENT, Math.round(value)));
}

/**
 * Whole days between `from` and `now`.
 * Returns null when the timestamp is missing or unparseable, so callers can
 * distinguish "no data" from "very old" — they score differently.
 */
function daysSince(from: string | null, now: Date): number | null {
  if (!from) return null;

  const then = new Date(from).getTime();
  if (Number.isNaN(then)) return null;

  return (now.getTime() - then) / DAY_MS;
}

/**
 * Maintenance (0-25): is anyone still looking after this?
 *
 * Recency of commits dominates, a recent release adds confidence, and a large
 * pile of open issues on an otherwise stale repo is penalised — that
 * combination is the clearest signal of abandonment.
 */
export function computeMaintenance(input: ScoringInput, now: Date): number {
  let score = 0;

  const commitAge = daysSince(input.lastCommitAt, now);
  if (commitAge !== null) {
    if (commitAge <= 30) score += 15;
    else if (commitAge <= 90) score += 10;
    else if (commitAge <= 180) score += 5;
  }

  const releaseAge = daysSince(input.lastReleaseAt, now);
  if (releaseAge !== null && releaseAge <= 90) score += 10;

  // Many open issues is only damning when nobody is responding to them.
  const isStale = commitAge === null || commitAge > 90;
  if (input.openIssues > 50 && isStale) score -= 5;

  return clampComponent(score);
}

/**
 * Popularity (0-25): how much has the ecosystem actually adopted this?
 *
 * Stars are logarithmic — the gap between 10 and 100 stars means far more than
 * the gap between 10,000 and 10,090 — so a linear scale would let a handful of
 * megaprojects flatten everything else into noise.
 */
export function computePopularity(input: ScoringInput, _now: Date): number {
  let score = Math.min(
    TRUST_MAX_COMPONENT,
    Math.floor(Math.log10(Math.max(0, input.stars) + 1) * 6),
  );

  if (input.isOfficial) score += 5;
  if ((input.npmWeeklyDownloads ?? 0) > 1000) score += 3;

  return clampComponent(score);
}

/**
 * Security (0-25): starts perfect and is reduced by what the scanner found.
 *
 * A single critical finding zeroes the component outright. That is deliberate:
 * "mostly safe" is not a useful thing to tell someone about to grant a server
 * shell access on their own machine.
 *
 * A server that has never been scanned is not penalised — absence of evidence
 * is not evidence of a vulnerability. The UI shows scan status separately so
 * "unscanned" is never mistaken for "clean".
 */
export function computeSecurity(input: ScoringInput, _now: Date): number {
  let score = TRUST_MAX_COMPONENT;

  if (!input.security) return clampComponent(score);

  for (const finding of input.security.findings) {
    score -= FINDING_PENALTY[finding.severity];
  }

  const audit = input.security.dependencyAudit;
  if (audit) {
    score -= audit.critical * DEPENDENCY_PENALTY.critical;
    score -= audit.high * DEPENDENCY_PENALTY.high;
    score -= audit.medium * DEPENDENCY_PENALTY.medium;
  }

  return clampComponent(score);
}

/**
 * Quality (0-25): five equally weighted engineering-hygiene signals.
 *
 * Each is cheap to detect and hard to fake, which is what makes the component
 * meaningful. None of them prove the code is good; together they show whether
 * the author was working carefully.
 */
export function computeQuality(input: ScoringInput, _now: Date): number {
  const { readmeLength, hasLicense, hasTypes, hasTests, hasCi } = input.quality;

  let score = 0;
  if (readmeLength > 500) score += 5;
  if (hasLicense) score += 5;
  if (hasTypes) score += 5;
  if (hasTests) score += 5;
  if (hasCi) score += 5;

  return clampComponent(score);
}

/**
 * Computes the full 0-100 Trust Score from its four 0-25 components.
 *
 * Pure and deterministic: given the same input and the same `now`, it always
 * returns the same score. That is what lets the algorithm be published,
 * audited, and argued with — which is the entire point of MCPHub.
 */
export function computeTrustScore(input: ScoringInput, options: ScoringOptions = {}): TrustScore {
  const now = options.now ?? new Date();

  const maintenance = computeMaintenance(input, now);
  const popularity = computePopularity(input, now);
  const security = computeSecurity(input, now);
  const quality = computeQuality(input, now);

  return {
    maintenance,
    popularity,
    security,
    quality,
    total: maintenance + popularity + security + quality,
  };
}
