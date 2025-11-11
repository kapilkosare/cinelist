
import { z } from 'zod';

/**
 * @fileOverview Types and schemas for the movie search AI flow.
 */

export const SearchMoviesInputSchema = z.object({
  query: z.string().describe('The search query for the movie title.'),
  type: z.string().describe('The type of content to search for (e.g., "movie", "web series", "content").'),
});
export type SearchMoviesInput = z.infer<typeof SearchMoviesInputSchema>;

export const MovieSearchResultSchema = z.object({
    title: z.string().describe('The full, official title of the movie.'),
    year: z.number().describe('The release year of the movie.'),
});
export type MovieSearchResult = z.infer<typeof MovieSearchResultSchema>;

export const SearchMoviesOutputSchema = z.object({
  results: z
    .array(MovieSearchResultSchema)
    .describe('A list of movies that match the search query.'),
});
export type SearchMoviesOutput = z.infer<typeof SearchMoviesOutputSchema>;
