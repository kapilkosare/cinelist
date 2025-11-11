import { z } from 'zod';

/**
 * @fileOverview Types and schemas for the movie details AI flow.
 */

export const MovieDetailsInputSchema = z.object({
  title: z.string().describe('The title of the movie to search for.'),
});
export type MovieDetailsInput = z.infer<typeof MovieDetailsInputSchema>;

export const MovieDetailsOutputSchema = z.object({
  title: z.string().describe('The official title of the movie.'),
  description: z.string().describe('A brief synopsis of the movie.'),
  posterUrl: z.string().url().describe("URL of the movie's poster image."),
  trailerUrl: z.string().url().describe("URL of the movie's trailer on YouTube."),
  rating: z.number().min(0).max(10).describe('The average rating of the movie (e.g., out of 10).'),
  year: z.number().describe('The release year of the movie.'),
  genreNames: z.array(z.string()).describe('A list of genre names for the movie (e.g., "Action", "Sci-Fi").'),
});
export type MovieDetailsOutput = z.infer<typeof MovieDetailsOutputSchema>;
