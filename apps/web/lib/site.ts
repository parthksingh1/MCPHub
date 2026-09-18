/**
 * Project-level identity: repository, social links, and canonical origin.
 *
 * Centralised and env-driven so a fork — or this project moving to its real
 * GitHub org — changes one variable rather than a placeholder scattered across
 * the header, footer, error page, and README.
 */

/** Canonical site origin, without a trailing slash. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
);

/** The public GitHub repository for this project. */
export const REPO_URL = (
  process.env.NEXT_PUBLIC_REPO_URL ?? 'https://github.com/parthksingh1/MCPHub'
).replace(/\/$/, '');

/** Where to file a bug. */
export const ISSUES_URL = `${REPO_URL}/issues/new`;

/** The Trust Score implementation, linked from the explainer. */
export const SCORING_SRC_URL = `${REPO_URL}/tree/main/packages/scoring`;

/** The contributing guide. */
export const CONTRIBUTING_URL = `${REPO_URL}/blob/main/CONTRIBUTING.md`;

/** The security policy in the repository. */
export const SECURITY_POLICY_URL = `${REPO_URL}/blob/main/SECURITY.md`;

/**
 * Optional email for security reports.
 *
 * Undefined by default on purpose: GitHub's private security advisories are
 * the better channel, and publishing a maintainer's personal address on a
 * public page invites more spam than disclosures. Set the env var only if you
 * want an address shown alongside the advisory link.
 */
export const SECURITY_CONTACT = process.env.NEXT_PUBLIC_SECURITY_EMAIL || null;

/** Where to open a private security advisory. */
export const SECURITY_ADVISORY_URL = `${REPO_URL}/security/advisories/new`;

/**
 * Optional general contact email, shown on the legal pages.
 *
 * Like {@link SECURITY_CONTACT}, off by default: the removal-request issue
 * template is the primary channel. Set it if you want a private route for
 * takedowns, privacy requests and Spotlight billing questions.
 */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || null;

/** Opens a pre-filled listing removal/correction request. */
export const REMOVAL_REQUEST_URL = `${REPO_URL}/issues/new?template=removal-request.yml`;
