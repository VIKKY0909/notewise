
'use server';

/**
 * @fileOverview Flow for generating accurate and exam-focused flashcards from document content.
 *
 * - generateFlashcards - A function that handles the flashcard generation process.
 * - GenerateFlashcardsInput - The input type for the generateFlashcards function.
 * - GenerateFlashcardsOutput - The return type for the generateFlashcards function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFlashcardsInputSchema = z.object({
  documentContent: z
    .string()
    .describe('The content of the document (e.g., study notes) to generate flashcards from.'),
});
export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsInputSchema>;

const GenerateFlashcardsOutputSchema = z.object({
  flashcards: z
    .array(z.object({
      question: z.string().describe('A clear, specific question targeting a key piece of information relevant for an exam. Must be factually accurate.'),
      answer: z.string().describe('A concise, accurate answer to the question. Must be factually accurate.')
    }))
    .describe('An array of generated flashcards, prioritizing accuracy and exam relevance. These should be production-quality and reliable for study.'),
  progress: z.string().describe('Progress summary of flashcard generation.'),
});
export type GenerateFlashcardsOutput = z.infer<typeof GenerateFlashcardsOutputSchema>;

export async function generateFlashcards(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput> {
  return generateFlashcardsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFlashcardsPrompt',
  input: {schema: GenerateFlashcardsInputSchema},
  output: {schema: GenerateFlashcardsOutputSchema},
  prompt: `You are an expert in educational material design, specializing in creating effective and highly accurate flashcards for exam preparation. Your output must be production-quality.

  Your task is to generate a set of flashcards (question and answer pairs) from the provided document content.

  Key requirements for the flashcards:
  1.  **Accuracy**: Each question and answer MUST be factually correct and directly verifiable from the document. This is paramount.
  2.  **Relevance**: Focus on the most important concepts, definitions, facts, formulas, dates, and details that are likely to be on an exam.
  3.  **Clarity**: Questions should be unambiguous and target a specific piece of knowledge.
  4.  **Conciseness**: Answers should be brief but complete, providing the necessary information without extraneous details.
  5.  **Coverage**: Aim to cover a good range of important topics from the document.
  6.  **Format**: Ensure the output is a valid JSON array of objects, where each object has a "question" and "answer" string field.

  Document Content:
  {{{documentContent}}}

  Generate flashcards based on these instructions. Prioritize accuracy and reliability above all.
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

const generateFlashcardsFlow = ai.defineFlow(
  {
    name: 'generateFlashcardsFlow',
    inputSchema: GenerateFlashcardsInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {
      ...output!,
      progress: 'Generated exam-focused, high-accuracy flashcards from the provided document content.',
    };
  }
);

