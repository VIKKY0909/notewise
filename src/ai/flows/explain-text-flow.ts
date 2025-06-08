
'use server';
/**
 * @fileOverview A flow to explain a given text in simple, easy-to-understand terms (ELI5).
 *
 * - explainTextInSimpleTerms - A function that handles the text simplification.
 * - ExplainTextInput - The input type for the function.
 * - ExplainTextOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainTextInputSchema = z.object({
  textToExplain: z
    .string()
    .describe('The piece of text that needs to be explained in simple terms.'),
});
export type ExplainTextInput = z.infer<typeof ExplainTextInputSchema>;

const ExplainTextOutputSchema = z.object({
  explanation: z
    .string()
    .describe('The simplified explanation of the input text, suitable for a 5-year-old or someone with no prior knowledge, while maintaining factual accuracy.'),
  progress: z.string().describe('Progress summary of the explanation process.'),
});
export type ExplainTextOutput = z.infer<typeof ExplainTextOutputSchema>;

export async function explainTextInSimpleTerms(
  input: ExplainTextInput
): Promise<ExplainTextOutput> {
  return explainTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainTextPrompt',
  input: {schema: ExplainTextInputSchema},
  output: {schema: ExplainTextOutputSchema},
  prompt: `You are an expert at explaining complex topics in a very simple and easy-to-understand way, as if you were talking to a 5-year-old (ELI5).
  Your explanation must be factually accurate but use the simplest possible language and analogies. Avoid jargon.

  The user has provided the following text:
  """
  {{textToExplain}}
  """

  Explain this text in simple terms.
  `,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const explainTextFlow = ai.defineFlow(
  {
    name: 'explainTextFlow',
    inputSchema: ExplainTextInputSchema,
    outputSchema: ExplainTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {
      explanation: output!.explanation,
      progress: 'Text explained in simple terms.',
    };
  }
);
