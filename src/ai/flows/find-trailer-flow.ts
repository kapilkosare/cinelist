
'use server';
/**
 * @fileOverview An AI agent for finding movie trailers on YouTube.
 *
 * - findTrailer - A function that handles fetching a YouTube trailer URL.
 * - FindTrailerInput - The input type for the findTrailer function.
 * - FindTrailerOutput - The return type for the findTrailer function.
 */

import { ai } from '@/ai/genkit';
import {
  FindTrailerInputSchema,
  type FindTrailerInput,
  FindTrailerOutputSchema,
  type FindTrailerOutput,
} from './find-trailer';


export async function findTrailer(
  input: FindTrailerInput
): Promise<FindTrailerOutput> {
  return findTrailerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findTrailerPrompt',
  input: { schema: FindTrailerInputSchema },
  output: { schema: FindTrailerOutputSchema },
  prompt: `You are a movie expert. Find the official YouTube trailer URL for the movie titled "{{title}}".
  
  Return the result in the specified JSON format.
  If you cannot find an official trailer, return an empty string for the "trailerUrl" field.
  `,
});

const findTrailerFlow = ai.defineFlow(
  {
    name: 'findTrailerFlow',
    inputSchema: FindTrailerInputSchema,
    outputSchema: FindTrailerOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
