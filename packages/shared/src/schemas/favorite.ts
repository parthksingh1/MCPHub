import { z } from 'zod';

/** A server saved to a user's dashboard. */
export const favoriteSchema = z.object({
  userId: z.string().uuid(),
  serverId: z.string().uuid(),
  createdAt: z.string().datetime(),
});
export type Favorite = z.infer<typeof favoriteSchema>;
