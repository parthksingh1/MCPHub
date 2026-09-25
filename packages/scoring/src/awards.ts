/**
 * MCPHub badges: distinctions a server earns automatically.
 *
 * Every badge is a pure function of public data, recomputed with the daily
 * refresh. None can be bought, requested, or granted by sponsorship — the only
 * human-granted one is `verified`, and it says so. The criteria below are the
 * exact rules, and are published verbatim on the /badges page.
 */

/** Identifiers of every badge, in display order (most meaningful first). */
export const AWARD_IDS = [
  'trusted',
  'security-clean',
  'top-rated',
  'verified',
  'official',
  'popular',
  'maintained',
  'rising',
] as const;

export type AwardId = (typeof AWARD_IDS)[number];

/** Public description of a badge and the rule that earns it. */
export interface AwardDefinition {
  id: AwardId;
  label: string;
  /** One line shown in tooltips and on the server page. */
  summary: string;
  /** The exact rule, in plain language. */
  criteria: string;
}

/** Thresholds, exported so the rules and the published text never drift. */
export const AWARD_THRESHOLDS = {
  trustedMinScore: 80,
  trustedMaxCommitAgeDays: 90,
  topRatedMinScore: 90,
  popularMinStars: 1000,
  maintainedMaxCommitAgeDays: 30,
  risingMinGain: 5,
  /** A scan older than this no longer counts as current. */
  scanMaxAgeDays: 60,
} as const;

const T = AWARD_THRESHOLDS;

export const AWARDS: Record<AwardId, AwardDefinition> = {
  trusted: {
    id: 'trusted',
    label: 'MCPHub Trusted',
    summary: 'Scores highly, scans clean, is maintained and properly licensed.',
    criteria: `Trust Score of ${T.trustedMinScore} or more, a current security scan with no critical or high findings, a commit in the last ${T.trustedMaxCommitAgeDays} days, a declared licence, and not deprecated.`,
  },
  'security-clean': {
    id: 'security-clean',
    label: 'Security clean',
    summary: 'Latest scan found no critical or high issues.',
    criteria: `Scanned in the last ${T.scanMaxAgeDays} days with no critical or high Semgrep findings and no critical or high dependency advisories.`,
  },
  'top-rated': {
    id: 'top-rated',
    label: 'Top rated',
    summary: `Trust Score of ${T.topRatedMinScore} or more.`,
    criteria: `Trust Score of ${T.topRatedMinScore} or more out of 100.`,
  },
  verified: {
    id: 'verified',
    label: 'Verified',
    summary: 'Reviewed by the MCPHub maintainers.',
    criteria:
      'Reviewed by hand by the MCPHub maintainers: the listing matches the repository and the install instructions work.',
  },
  official: {
    id: 'official',
    label: 'Official',
    summary: 'Published by the company or project it integrates with.',
    criteria: 'Published by the vendor or project the server integrates with.',
  },
  popular: {
    id: 'popular',
    label: 'Popular',
    summary: `${T.popularMinStars.toLocaleString('en-US')}+ GitHub stars.`,
    criteria: `At least ${T.popularMinStars.toLocaleString('en-US')} GitHub stars. Levels up to silver at 10,000 and gold at 50,000.`,
  },
  maintained: {
    id: 'maintained',
    label: 'Actively maintained',
    summary: `Committed to in the last ${T.maintainedMaxCommitAgeDays} days.`,
    criteria: `At least one commit in the last ${T.maintainedMaxCommitAgeDays} days.`,
  },
  rising: {
    id: 'rising',
    label: 'Rising',
    summary: `Trust Score up ${T.risingMinGain}+ points recently.`,
    criteria: `Trust Score rose by ${T.risingMinGain} points or more since the previous weekly snapshot.`,
  },
};

/** Medal tiers, like a game: the Popular badge levels up with stars. */
export type AwardTier = 'bronze' | 'silver' | 'gold';

/** Star thresholds for each Popular tier, highest first. */
export const POPULAR_TIERS: readonly { tier: AwardTier; minStars: number }[] = [
  { tier: 'gold', minStars: 50_000 },
  { tier: 'silver', minStars: 10_000 },
  { tier: 'bronze', minStars: T.popularMinStars },
];

/** The Popular tier for a star count, or null below the bronze bar. */
export function popularTier(stars: number): AwardTier | null {
  return POPULAR_TIERS.find((level) => stars >= level.minStars)?.tier ?? null;
}

/** The minimal shape of a security scan result the rules need. */
export interface ScanSummary {
  scanned: boolean;
  lastScanAt: string | null;
  findings: { severity: string }[];
  dependencyAudit?: { critical: number; high: number } | undefined;
}

/** Everything the rules read. All of it is public data. */
export interface AwardInput {
  trustTotal: number;
  trustPrevious: number | null;
  lastCommitAt: Date | string | null;
  license: string | null;
  githubStars: number;
  isOfficial: boolean;
  verified: boolean;
  deprecated: boolean;
  /** Whether the latest scan is current and clean; see {@link isScanClean}. */
  scanClean: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Age in days of a timestamp relative to `now`, or Infinity when unknown. */
function ageInDays(value: Date | string | null, now: Date): number {
  if (value === null) return Number.POSITIVE_INFINITY;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return Number.POSITIVE_INFINITY;
  return (now.getTime() - time) / DAY_MS;
}

/**
 * True when a scan is current and found nothing critical or high.
 *
 * An unscanned server is never "clean": the absence of evidence is not
 * evidence, and a badge that implied otherwise would be the one thing MCPHub
 * must never do.
 */
export function isScanClean(scan: ScanSummary | null, now: Date = new Date()): boolean {
  if (!scan?.scanned) return false;
  if (ageInDays(scan.lastScanAt, now) > T.scanMaxAgeDays) return false;

  const severe = scan.findings.some(
    (finding) => finding.severity === 'critical' || finding.severity === 'high',
  );
  const audit = scan.dependencyAudit;
  const vulnerableDeps = audit !== undefined && audit.critical + audit.high > 0;

  return !severe && !vulnerableDeps;
}

/**
 * The badges a server has earned, in display order.
 *
 * Deprecated servers earn nothing except the factual `official` marker:
 * recommending something its own author has retired would be misleading.
 */
export function computeAwards(input: AwardInput, now: Date = new Date()): AwardId[] {
  const earned = new Set<AwardId>();
  const commitAge = ageInDays(input.lastCommitAt, now);

  if (input.isOfficial) earned.add('official');

  if (!input.deprecated) {
    if (input.verified) earned.add('verified');
    if (input.scanClean) earned.add('security-clean');
    if (input.trustTotal >= T.topRatedMinScore) earned.add('top-rated');
    if (input.githubStars >= T.popularMinStars) earned.add('popular');
    if (commitAge <= T.maintainedMaxCommitAgeDays) earned.add('maintained');
    if (input.trustPrevious !== null && input.trustTotal - input.trustPrevious >= T.risingMinGain) {
      earned.add('rising');
    }
    if (
      input.trustTotal >= T.trustedMinScore &&
      input.scanClean &&
      commitAge <= T.trustedMaxCommitAgeDays &&
      input.license !== null &&
      input.license.trim() !== ''
    ) {
      earned.add('trusted');
    }
  }

  return AWARD_IDS.filter((id) => earned.has(id));
}
