
'use server';

/**
 * @fileOverview Summarizes a document provided as input, focusing on critical information for study, with customizable length and style.
 *
 * - summarizeDocument - A function that summarizes the document.
 * - SummarizeDocumentInput - The input type for the summarizeDocument function.
 * - SummarizeDocumentOutput - The return type for the summarizeDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeDocumentInputSchema = z.object({
  documentContent: z
    .string()
    .describe('The content of the document (typically generated notes) to be summarized.'),
  summaryLength: z
    .enum(['short', 'medium', 'comprehensive'])
    .optional()
    .default('medium')
    .describe("The desired length of the summary: 'short' for a very brief overview, 'medium' for a balanced summary, or 'comprehensive' for a more detailed one."),
  summaryStyle: z
    .enum(['paragraph', 'bullet_points'])
    .optional()
    .default('paragraph')
    .describe("The desired style of the summary: 'paragraph' for a narrative summary, or 'bullet_points' for a list of key points."),
});
export type SummarizeDocumentInput = z.infer<typeof SummarizeDocumentInputSchema>;

const SummarizeDocumentOutputSchema = z.object({
  summary: z.string().describe('A concise yet comprehensive summary in PLAIN TEXT, highlighting the most critical concepts, arguments, and conclusions for exam review. This summary must be accurate and reliable, adhering to the requested length and style. It should NOT contain Markdown syntax like headings or complex formatting.'),
  progress: z.string().describe('Progress of document summarization.'),
});
export type SummarizeDocumentOutput = z.infer<typeof SummarizeDocumentOutputSchema>;

export async function summarizeDocument(input: SummarizeDocumentInput): Promise<SummarizeDocumentOutput> {
  return summarizeDocumentFlow(input);
}

const summarizeDocumentPrompt = ai.definePrompt({
  name: 'summarizeDocumentPrompt',
  input: {schema: SummarizeDocumentInputSchema},
  output: {schema: SummarizeDocumentOutputSchema},
  prompt: `You are an expert at creating highly impactful PLAIN TEXT summaries for exam preparation.
The user has provided document content (likely study notes). Your task is to summarize this content according to the requested length ("{{summaryLength}}") and style ("{{summaryStyle}}").

The summary MUST be in PLAIN TEXT and MUST NOT include any Markdown syntax (e.g., no '##', '*', '_', etc. for formatting).

1.  **Adhere to Requested Length ("{{summaryLength}}")**:
    - If "short": Generate a **short, very brief** plain text summary. Focus on the absolute main takeaways.
    - If "comprehensive": Generate a **comprehensive, detailed** plain text summary. Cover all major sections, arguments, and supporting details thoroughly.
    - If "medium": Generate a **medium-length, balanced** plain text summary.

2.  **Adhere to Requested Style ("{{summaryStyle}}")**:
    - If "bullet_points": Present the summary as a **plain text bulleted list**. Use simple text prefixes like '-' or '•' for each point. Do NOT use Markdown list syntax. Each bullet should be clear and impactful.
    - If "paragraph": Present the summary in well-structured **plain text paragraph form**.

3.  **Conciseness & Comprehensiveness (within the requested length)**: Adjust detail according to the chosen length.
4.  **Clarity and Accuracy**: The summary must be easy to understand and factually correct based on the provided content. Reliability is key.
5.  **Exam Focus**: Extract and emphasize the information most likely to be tested.

Document Content:
{{{documentContent}}}

Generate a PLAIN TEXT summary based on these instructions, ensuring the output is reliable and high-quality. Avoid all Markdown formatting.
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

const summarizeDocumentFlow = ai.defineFlow(
  {
    name: 'summarizeDocumentFlow',
    inputSchema: SummarizeDocumentInputSchema,
    outputSchema: SummarizeDocumentOutputSchema,
  },
  async input => {
    const {output} = await summarizeDocumentPrompt(input);
    output!.progress = `The document content has been processed and summarized (Length: ${input.summaryLength}, Style: ${input.summaryStyle}) for quick review.`;
    return output!;
  }
);

