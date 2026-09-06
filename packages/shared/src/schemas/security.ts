import { z } from 'zod';

import { SEVERITIES } from '../constants';

/** Severity of a scanner finding or dependency advisory. */
export const severitySchema = z.enum(SEVERITIES);

/** A single static-analysis finding produced by the Semgrep ruleset. */
export const securityFindingSchema = z.object({
  ruleId: z.string(),
  severity: severitySchema,
  message: z.string(),
  file: z.string().optional(),
  line: z.number().int().positive().optional(),
  /** Short, human-readable explanation of why this matters for an MCP server. */
  rationale: z.string().optional(),
});
export type SecurityFinding = z.infer<typeof securityFindingSchema>;

/** Aggregated `npm audit` / `pip-audit` result, counted by severity. */
export const dependencyAuditSchema = z.object({
  tool: z.enum(['npm-audit', 'pip-audit', 'none']).default('none'),
  critical: z.number().int().min(0).default(0),
  high: z.number().int().min(0).default(0),
  medium: z.number().int().min(0).default(0),
  low: z.number().int().min(0).default(0),
  total: z.number().int().min(0).default(0),
});
export type DependencyAudit = z.infer<typeof dependencyAuditSchema>;

/** Full contents of the `servers.security` JSONB column. */
export const serverSecuritySchema = z.object({
  lastScanAt: z.string().datetime().nullable().default(null),
  /** False when the repo was skipped (too large, clone failed, unsupported). */
  scanned: z.boolean().default(false),
  skipReason: z.string().nullable().default(null),
  findings: z.array(securityFindingSchema).default([]),
  dependencyAudit: dependencyAuditSchema.optional(),
});
export type ServerSecurity = z.infer<typeof serverSecuritySchema>;
