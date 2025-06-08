
'use server';
/**
 * @fileOverview A flow to answer questions based on provided document content with high accuracy.
 *
 * - answerQuestionFromDocument - A function that handles answering a question based on document content.
 * - AnswerQuestionInput - The input type for the answerQuestionFromDocument function.
 * - AnswerQuestionOutput - The return type for the answerQuestionFromDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerQuestionInputSchema = z.object({
  notesContent: z
    .string()
    .describe('The content of the notes or document to base the answer on. This is the sole source of truth and answers must be derived exclusively from it.'),
  userQuestion: z.string().describe('The question asked by the user.'),
});
export type AnswerQuestionInput = z.infer<typeof AnswerQuestionInputSchema>;

const AnswerQuestionOutputSchema = z.object({
  answer: z
    .string()
    .describe('The answer to the question, derived *exclusively* and with utmost accuracy from the provided document content. If the answer is not found, this will explicitly state so. The answer must be reliable and suitable for exam study.'),
  progress: z
    .string()
    .describe('Progress summary of the question answering process.'),
});
export type AnswerQuestionOutput = z.infer<typeof AnswerQuestionOutputSchema>;

export async function answerQuestionFromDocument(
  input: AnswerQuestionInput
): Promise<AnswerQuestionOutput> {
  return answerQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerQuestionPrompt',
  input: {schema: AnswerQuestionInputSchema},
  output: {schema: AnswerQuestionOutputSchema},
  prompt: `You are a highly meticulous AI assistant. Your primary function is to answer a user's question with extreme accuracy, based *solely and exclusively* on the provided "Document Content". Your responses must be reliable.

  Instructions:
  1.  **Strict Adherence to Document**: You MUST NOT use any external knowledge, assumptions, or information outside of the "Document Content". Your entire answer must be derivable from it.
  2.  **Accuracy is Paramount**: The answer must be factually correct according to the "Document Content". If you are unsure, or if the information is ambiguous, state that the answer cannot be definitively provided from the document.
  3.  **Direct Answers**: If the information is present, provide a direct answer to the "User's Question".
  4.  **Information Not Found**: If the answer to the "User's Question" *cannot be found* within the "Document Content", you MUST respond with the exact phrase: "I could not find an answer to that question in the provided document." Do not attempt to infer, guess, or provide related information if the specific answer isn't there.
  5.  **Reliability for Study**: Assume the user is relying on this answer for exam preparation. Ensure it is precise and trustworthy.

  Document Content:
  {{{notesContent}}}

  User's Question:
  {{{userQuestion}}}
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

const answerQuestionFlow = ai.defineFlow(
  {
    name: 'answerQuestionFlow',
    inputSchema: AnswerQuestionInputSchema,
    outputSchema: AnswerQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {
      answer: output!.answer,
      progress: 'Question answered based on the document content with a focus on accuracy.',
    };
  }
);

