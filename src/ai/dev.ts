
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-flashcards.ts';
import '@/ai/flows/generate-notes.ts';
import '@/ai/flows/summarize-document.ts';
import '@/ai/flows/answer-question.ts';
import '@/ai/flows/explain-text-flow.ts';
import '@/ai/flows/extract-key-concepts.ts';
