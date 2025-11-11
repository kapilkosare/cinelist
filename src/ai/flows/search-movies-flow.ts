
'use server';
/**
 * @fileOverview A movie searching AI agent.
 *
 * - searchMovies - A function that handles searching for movies by title.
 */

import { ai } from '@/ai/genkit';
import {
  SearchMoviesInputSchema,
  type SearchMoviesInput,
  SearchMoviesOutputSchema,
  type SearchMoviesOutput,
} from './search-movies';


export async function searchMovies(input: SearchMoviesInput): Promise<SearchMoviesOutput> {
  return searchMoviesFlow(input);
}


const prompt = ai.definePrompt({
  name: 'searchMoviesPrompt',
  input: { schema: SearchMoviesInputSchema },
  output: { schema: SearchMoviesOutputSchema },
  prompt: `You are a media database expert. Your task is to find up to 5 content titles (like movies, series, documentaries) that match the user's search query.
  
  For the query: "{{query}}", find a list of matching {{type}}.

  For each title, provide:
  - The full, official title.
  - The release year.

  Return the information in the specified JSON format. If no titles are found, return an empty array for the "results" field.
  `,
});


const searchMoviesFlow = ai.defineFlow(
  {
    name: 'searchMoviesFlow',
    inputSchema: SearchMoviesInputSchema,
    outputSchema: SearchMoviesOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
