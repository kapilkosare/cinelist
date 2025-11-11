import { z } from 'zod';

/**
 * @fileOverview Types and schemas for the movie trailer finder AI flow.
 */

export const FindTrailerInputSchema = z.object({
  title: z.string().describe('The title of the movie to find a trailer for.'),
});
export type FindTrailerInput = z.infer<typeof FindTrailerInputSchema>;

export const FindTrailerOutputSchema = z.object({
  trailerUrl: z
    .string()
    .url()
    .describe('The official YouTube URL for the movie trailer.'),
});
export type FindTrailerOutput = z.infer<typeof FindTrailerOutputSchema>;
