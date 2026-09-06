import { z } from 'zod';

import { REPORT_REASONS, REPORT_STATUSES } from '../constants';

/** A user-filed report against an indexed server. */
export const reportSchema = z.object({
  id: z.string().uuid(),
  serverId: z.string().uuid(),
  reportedBy: z.string().uuid().nullable(),
  reason: z.enum(REPORT_REASONS),
  details: z.string().nullable(),
  status: z.enum(REPORT_STATUSES),
  createdAt: z.string().datetime(),
});
export type Report = z.infer<typeof reportSchema>;

/** Request body for `POST /api/servers/[slug]/report`. */
export const createReportSchema = z.object({
  reason: z.enum(REPORT_REASONS),
  details: z.string().trim().max(1000).optional(),
});
export type CreateReportInput = z.infer<typeof createReportSchema>;
