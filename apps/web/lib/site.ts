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
  process.env.NEXT_PUBLIC_REPO_URL ?? 'https://github.com/mcphub/mcphub'
).replace(/\/$/, '');

/** Where to file a bug. */
export const ISSUES_URL = `${REPO_URL}/issues/new`;

/** The Trust Score implementation, linked from the explainer. */
export const SCORING_SRC_URL = `${REPO_URL}/tree/main/packages/scoring`;

/** The contributing guide. */
export const CONTRIBUTING_URL = `${REPO_URL}/blob/main/CONTRIBUTING.md`;

/** The security policy in the repository. */
export const SECURITY_POLICY_URL = `${REPO_URL}/blob/main/SECURITY.md`;

/** Where to report a vulnerability in MCPHub itself. */
export const SECURITY_CONTACT = process.env.NEXT_PUBLIC_SECURITY_EMAIL ?? 'security@mcphub.dev';
