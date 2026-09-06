import { z } from 'zod';

import { CATEGORIES, SUBMISSION_STATUSES } from '../constants';

/** A GitHub repository URL, normalised and validated. */
export const repoUrlSchema = z
  .string()
  .trim()
  .url()
  .max(300)
  .refine((value) => /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(value), {
    message: 'Must be a GitHub repository URL, e.g. https://github.com/owner/repo',
  });

/** A community-submitted server awaiting indexing. */
export const submissionSchema = z.object({
  id: z.string().uuid(),
  repoUrl: repoUrlSchema,
  submittedBy: z.string().uuid().nullable(),
  notes: z.string().nullable(),
  status: z.enum(SUBMISSION_STATUSES),
  serverId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  processedAt: z.string().datetime().nullable(),
});
export type Submission = z.infer<typeof submissionSchema>;

/**
 * Request body for `POST /api/submissions`.
 * `website` is a honeypot: real users never see it, bots fill it in.
 */
export const createSubmissionSchema = z.object({
  repoUrl: repoUrlSchema,
  categories: z.array(z.enum(CATEGORIES)).max(3).optional(),
  notes: z.string().trim().max(1000).optional(),
  website: z.string().max(0).optional(),
});
export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
