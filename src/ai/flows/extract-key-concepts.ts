
'use server';
/**
 * @fileOverview A flow to extract key concepts and their definitions from document content.
 *
 * - extractKeyConcepts - A function that handles the key concept extraction.
 * - ExtractKeyConceptsInput - The input type for the function.
 * - ExtractKeyConceptsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractKeyConceptsInputSchema = z.object({
  documentContent: z
    .string()
    .describe('The content of the document (e.g., study notes) from which to extract key concepts.'),
});
export type ExtractKeyConceptsInput = z.infer<typeof ExtractKeyConceptsInputSchema>;

const KeyConceptSchema = z.object({
  term: z.string().describe('A significant key term or concept identified from the document.'),
  definition: z.string().describe('A concise definition of the term, derived *exclusively* from the provided document content. This definition must not use external knowledge.'),
});

const ExtractKeyConceptsOutputSchema = z.object({
  concepts: z
    .array(KeyConceptSchema)
    .describe('An array of extracted key concepts, each with a term and its definition based *solely* on the document.'),
  progress: z.string().describe('Progress summary of key concept extraction.'),
});
export type ExtractKeyConceptsOutput = z.infer<typeof ExtractKeyConceptsOutputSchema>;

export async function extractKeyConcepts(
  input: ExtractKeyConceptsInput
): Promise<ExtractKeyConceptsOutput> {
  return extractKeyConceptsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractKeyConceptsPrompt',
  input: {schema: ExtractKeyConceptsInputSchema},
  output: {schema: ExtractKeyConceptsOutputSchema},
  prompt: `You are an expert academic assistant specializing in identifying and defining key terminology and concepts from textual content.
  Your task is to analyze the provided "Document Content" and extract the most important key terms/concepts.
  For each identified term/concept, you MUST provide a concise definition. This definition MUST be derived *solely and exclusively* from the information present in the "Document Content".
  Do NOT use any external knowledge or make assumptions beyond what is explicitly stated or clearly implied in the text.

  Output Format:
  Provide the output as a list of objects, where each object has a "term" (string) and a "definition" (string).

  Document Content:
  {{{documentContent}}}

  Extract key concepts and their definitions based *only* on this document.
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

const extractKeyConceptsFlow = ai.defineFlow(
  {
    name: 'extractKeyConceptsFlow',
    inputSchema: ExtractKeyConceptsInputSchema,
    outputSchema: ExtractKeyConceptsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {
      concepts: output!.concepts,
      progress: 'Key concepts and definitions extracted from the document.',
    };
  }
);
