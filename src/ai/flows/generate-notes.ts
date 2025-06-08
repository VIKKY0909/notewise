
// src/ai/flows/generate-notes.ts
'use server';
/**
 * @fileOverview A flow to generate study notes from uploaded documents.
 *
 * - generateNotes - A function that handles the generation of notes from a document.
 * - GenerateNotesInput - The input type for the generateNotes function.
 * - GenerateNotesOutput - The return type for the generateNotes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNotesInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A document (PDF, .txt) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateNotesInput = z.infer<typeof GenerateNotesInputSchema>;

const GenerateNotesOutputSchema = z.object({
  notes: z.string().describe('Comprehensive, well-structured study notes in Markdown format, focusing on key concepts, definitions, and exam-relevant information. These should be production-quality, reliable notes suitable for intensive exam preparation.'),
  progress: z.string().describe('A short, one-sentence summary of the progress.')
});
export type GenerateNotesOutput = z.infer<typeof GenerateNotesOutputSchema>;

export async function generateNotes(input: GenerateNotesInput): Promise<GenerateNotesOutput> {
  return generateNotesFlow(input);
}

const generateNotesPrompt = ai.definePrompt({
  name: 'generateNotesPrompt',
  input: {schema: GenerateNotesInputSchema},
  output: {schema: GenerateNotesOutputSchema},
  prompt: `You are an expert academic assistant specializing in creating high-quality, comprehensive study notes for exam preparation. Your output must be production-quality and reliable.

  Your task is to generate detailed and well-structured study notes from the provided document. The notes MUST be in Markdown format.

  Key requirements for the notes:
  1.  **Comprehensiveness**: Cover ALL major topics, key concepts, definitions, important figures, dates, formulas, and arguments presented in the document.
  2.  **Accuracy**: Ensure ALL information is accurately extracted and represented. This is critical.
  3.  **Structure**: Use Markdown headings (e.g., #, ##, ###), subheadings, bullet points (-, *), and numbered lists (1., 2.) to organize the information logically and clearly. This is crucial for readability and effective study.
  4.  **Clarity and Conciseness**: While being comprehensive, express information clearly and concisely. Avoid jargon where possible or explain it.
  5.  **Exam Focus**: Prioritize information that is likely to be important for an exam. This includes core principles, methodologies, results, and significant details.
  6.  **Handling Length**: If the document is very long, focus on creating a robust summary of key sections while still extracting vital details. The goal is to produce the most useful study material possible. Ensure the output format is maintained.

  Document: {{media url=documentDataUri}}
  `,config: {
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

const generateNotesFlow = ai.defineFlow(
  {
    name: 'generateNotesFlow',
    inputSchema: GenerateNotesInputSchema,
    outputSchema: GenerateNotesOutputSchema,
  },
  async input => {
    const {output} = await generateNotesPrompt(input);
    return {
      notes: output!.notes,
      progress: 'Generated detailed, production-quality study notes from the uploaded document.',
    };
  }
);
