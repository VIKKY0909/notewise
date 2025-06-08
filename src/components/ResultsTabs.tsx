
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SummaryDisplay } from "./SummaryDisplay";
import { NotesDisplay } from "./NotesDisplay";
import { FlashcardsDisplay } from "./FlashcardsDisplay";
import { QADisplay } from "./QADisplay";
import { KeyConceptsDisplay } from "./KeyConceptsDisplay"; // New import
import type { GenerateFlashcardsOutput } from "@/ai/flows/generate-flashcards";
import type { ExtractKeyConceptsOutput } from "@/ai/flows/extract-key-concepts"; // New import

interface ResultsTabsProps {
  summary: string | null;
  notes: string | null;
  flashcards: GenerateFlashcardsOutput['flashcards'] | null;
  keyConcepts: ExtractKeyConceptsOutput['concepts'] | null; // New prop
  isProcessingKeyConcepts: boolean; // New prop
  keyConceptsError: string | null; // New prop
  // Q&A Props
  onAskQuestion: (question: string) => Promise<void>;
  qaAnswer: string | null;
  isAskingQuestion: boolean;
  qaError: string | null;
  // Highlighting & Annotation & ELI5 Props
  highlightedSegments: string[];
  onToggleHighlight: (segmentKey: string) => void;
  annotations: Record<string, string>;
  onAddOrUpdateAnnotation: (segmentKey: string, text: string) => void;
  onRemoveAnnotation: (segmentKey: string) => void;
  onRequestExplanation: (text: string) => void;
}

export function ResultsTabs({ 
  summary, 
  notes, 
  flashcards,
  keyConcepts, // New prop
  isProcessingKeyConcepts, // New prop
  keyConceptsError, // New prop
  onAskQuestion,
  qaAnswer,
  isAskingQuestion,
  qaError,
  highlightedSegments,
  onToggleHighlight,
  annotations,
  onAddOrUpdateAnnotation,
  onRemoveAnnotation,
  onRequestExplanation,
}: ResultsTabsProps) {
  const notesAvailable = !!notes;

  return (
    <Tabs defaultValue="summary" className="w-full">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 mb-6">
        <TabsTrigger value="summary">Summary</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
        <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
        <TabsTrigger value="concepts" disabled={!notesAvailable && !keyConcepts}>Key Concepts</TabsTrigger>
        <TabsTrigger value="qa" disabled={!notesAvailable}>Q&A</TabsTrigger>
      </TabsList>
      <TabsContent value="summary">
        <SummaryDisplay summary={summary} />
      </TabsContent>
      <TabsContent value="notes">
        <NotesDisplay 
            notes={notes} 
            highlightedSegments={highlightedSegments}
            onToggleHighlight={onToggleHighlight}
            annotations={annotations}
            onAddOrUpdateAnnotation={onAddOrUpdateAnnotation}
            onRemoveAnnotation={onRemoveAnnotation}
            onRequestExplanation={onRequestExplanation}
        />
      </TabsContent>
      <TabsContent value="flashcards">
        <FlashcardsDisplay flashcards={flashcards} />
      </TabsContent>
      <TabsContent value="concepts">
        <KeyConceptsDisplay 
          concepts={keyConcepts}
          isLoading={isProcessingKeyConcepts}
          error={keyConceptsError}
        />
      </TabsContent>
      <TabsContent value="qa">
        <QADisplay 
          onAskQuestion={onAskQuestion}
          answer={qaAnswer}
          isAsking={isAskingQuestion}
          qaError={qaError}
          notesAvailable={notesAvailable}
        />
      </TabsContent>
    </Tabs>
  );
}
