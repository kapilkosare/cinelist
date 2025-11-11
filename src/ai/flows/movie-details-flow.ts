'use server';
/**
 * @fileOverview A movie details fetching AI agent.
 *
 * - getMovieDetails - A function that handles fetching movie details.
 */

import { ai } from '@/ai/genkit';
import {
  MovieDetailsInputSchema,
  type MovieDetailsInput,
  MovieDetailsOutputSchema,
  type MovieDetailsOutput,
} from './movie-details';


export async function getMovieDetails(input: MovieDetailsInput): Promise<MovieDetailsOutput> {
  return getMovieDetailsFlow(input);
}


const prompt = ai.definePrompt({
  name: 'getMovieDetailsPrompt',
  input: { schema: MovieDetailsInputSchema },
  output: { schema: MovieDetailsOutputSchema },
  prompt: `You are a movie expert and your task is to find the details for a given movie title.
  
  Provide the following details for the movie: "{{title}}".

  - The official title.
  - A brief synopsis or description.
  - A URL for the movie poster. Find a high-quality poster image.
  - The YouTube URL for the official trailer.
  - The IMDb rating (out of 10).
  - The release year.
  - A list of up to 3 relevant genre names.

  Return the information in the specified JSON format.
  If you cannot find the movie, do your best but ensure the response format is still valid, you can leave fields empty if needed.
  `,
});


const getMovieDetailsFlow = ai.defineFlow(
  {
    name: 'getMovieDetailsFlow',
    inputSchema: MovieDetailsInputSchema,
    outputSchema: MovieDetailsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
