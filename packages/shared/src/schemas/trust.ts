import { z } from 'zod';

import { TRUST_MAX_COMPONENT, TRUST_MAX_TOTAL } from '../constants';

/** A single 0-25 Trust Score component. */
export const trustComponentSchema = z.number().int().min(0).max(TRUST_MAX_COMPONENT);

/**
 * The four-part Trust Score breakdown plus its total.
 * Produced by `@mcphub/scoring` and denormalised onto the `servers` row.
 */
export const trustScoreSchema = z.object({
  maintenance: trustComponentSchema,
  popularity: trustComponentSchema,
  security: trustComponentSchema,
  quality: trustComponentSchema,
  total: z.number().int().min(0).max(TRUST_MAX_TOTAL),
});
export type TrustScore = z.infer<typeof trustScoreSchema>;
