import { z } from 'zod';

/** A user's 1-5 star rating of a server, with an optional written review. */
export const ratingSchema = z.object({
  id: z.string().uuid(),
  serverId: z.string().uuid(),
  userId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  review: z.string().max(2000).nullable(),
  createdAt: z.string().datetime(),
});
export type Rating = z.infer<typeof ratingSchema>;

/** Request body for `POST /api/servers/[slug]/ratings`. */
export const createRatingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().trim().max(2000).optional(),
});
export type CreateRatingInput = z.infer<typeof createRatingSchema>;
