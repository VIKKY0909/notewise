
'use client';

import { useState, type ChangeEvent, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { FileUpload } from '@/components/FileUpload';
import { ResultsTabs } from '@/components/ResultsTabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Terminal, Settings2, Info, Loader2, Brain } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import mammoth from 'mammoth';

import { generateNotes, type GenerateNotesOutput } from '@/ai/flows/generate-notes';
import { summarizeDocument, type SummarizeDocumentInput, type SummarizeDocumentOutput } from '@/ai/flows/summarize-document';
import { generateFlashcards, type GenerateFlashcardsOutput } from '@/ai/flows/generate-flashcards';
import { answerQuestionFromDocument, type AnswerQuestionOutput } from '@/ai/flows/answer-question';
import { explainTextInSimpleTerms, type ExplainTextOutput } from '@/ai/flows/explain-text-flow';
import { extractKeyConcepts, type ExtractKeyConceptsOutput } from '@/ai/flows/extract-key-concepts';


type SummaryLength = NonNullable<SummarizeDocumentInput['summaryLength']>;
type SummaryStyle = NonNullable<SummarizeDocumentInput['summaryStyle']>;

const NOTES_HIGHLIGHT_KEY = 'noteWiseCurrentHighlights';
const ANNOTATIONS_KEY = 'noteWiseAnnotations';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [inputText, setInputText] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');

  const [summary, setSummary] = useState<string | null>(null);
  const [notes, setNotes] = useState<string | null>(null); 
  const [flashcards, setFlashcards] = useState<GenerateFlashcardsOutput['flashcards'] | null>(null);
  const [keyConcepts, setKeyConcepts] = useState<ExtractKeyConceptsOutput['concepts'] | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExtractingDocx, setIsExtractingDocx] = useState(false); // New state for DOCX parsing
  const [progressValue, setProgressValue] = useState(0);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [qaAnswer, setQaAnswer] = useState<string | null>(null);
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [qaError, setQaError] = useState<string | null>(null);

  const [enableSummaryCustomization, setEnableSummaryCustomization] = useState(false);
  const [summaryLength, setSummaryLength] = useState<SummaryLength>('medium');
  const [summaryStyle, setSummaryStyle] = useState<SummaryStyle>('paragraph');

  const [highlightedSegments, setHighlightedSegments] = useState<string[]>([]);
  const [annotations, setAnnotations] = useState<Record<string, string>>({});

  const [isEli5DialogOpen, setIsEli5DialogOpen] = useState(false);
  const [eli5Explanation, setEli5Explanation] = useState<string | null>(null);
  const [eli5OriginalText, setEli5OriginalText] = useState<string | null>(null);
  const [isProcessingEli5, setIsProcessingEli5] = useState(false);
  const [eli5Error, setEli5Error] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (notes) {
      const storedHighlights = localStorage.getItem(NOTES_HIGHLIGHT_KEY);
      if (storedHighlights) {
        try {
          setHighlightedSegments(JSON.parse(storedHighlights));
        } catch (e) {
          console.error("Failed to parse stored highlights", e);
          setHighlightedSegments([]);
          localStorage.removeItem(NOTES_HIGHLIGHT_KEY);
        }
      } else {
        setHighlightedSegments([]); 
      }
    } else {
      setHighlightedSegments([]); 
      localStorage.removeItem(NOTES_HIGHLIGHT_KEY); 
    }
  }, [notes]); 

  useEffect(() => {
    if (notes && highlightedSegments.length > 0) {
      localStorage.setItem(NOTES_HIGHLIGHT_KEY, JSON.stringify(highlightedSegments));
    } else if (notes && highlightedSegments.length === 0) {
      localStorage.removeItem(NOTES_HIGHLIGHT_KEY);
    }
  }, [highlightedSegments, notes]);

  useEffect(() => {
    if (notes) {
      const storedAnnotationsRaw = localStorage.getItem(ANNOTATIONS_KEY);
      if (storedAnnotationsRaw) {
        try {
          const parsedAnnotations = JSON.parse(storedAnnotationsRaw);
          setAnnotations(parsedAnnotations || {}); 
        } catch (e) {
          console.error("Failed to parse stored annotations", e);
          setAnnotations({}); 
          localStorage.removeItem(ANNOTATIONS_KEY);
        }
      } else {
        setAnnotations({}); 
      }
    } else {
      setAnnotations({}); 
      localStorage.removeItem(ANNOTATIONS_KEY); 
    }
  }, [notes]);

  useEffect(() => {
    if (notes) { 
      if (Object.keys(annotations).length > 0) {
        localStorage.setItem(ANNOTATIONS_KEY, JSON.stringify(annotations));
      } else {
        localStorage.removeItem(ANNOTATIONS_KEY);
      }
    }
  }, [annotations, notes]);


  const resetAllResults = () => {
    setSummary(null);
    setNotes(null); 
    setFlashcards(null);
    setKeyConcepts(null);
    setError(null);
    setProgressValue(0);
    setProgressMessage(null);
    setQaAnswer(null);
    setQaError(null);
    
    setHighlightedSegments([]); 
    localStorage.removeItem(NOTES_HIGHLIGHT_KEY);
    setAnnotations({}); 
    localStorage.removeItem(ANNOTATIONS_KEY);

    setEli5Explanation(null);
    setEli5OriginalText(null);
    setEli5Error(null);
    setIsEli5DialogOpen(false);
  };

  const handleToggleHighlight = (segmentKey: string) => {
    setHighlightedSegments(prev =>
      prev.includes(segmentKey)
        ? prev.filter(key => key !== segmentKey)
        : [...prev, segmentKey]
    );
  };

  const handleAddOrUpdateAnnotation = (segmentKey: string, text: string) => {
    setAnnotations(prev => ({
      ...prev,
      [segmentKey]: text,
    }));
    toast({ title: "Note Saved", description: "Your note has been saved for this session." });
  };

  const handleRemoveAnnotation = (segmentKey: string) => {
    setAnnotations(prev => {
      const newAnnotations = { ...prev };
      delete newAnnotations[segmentKey];
      return newAnnotations;
    });
    toast({ title: "Note Removed", description: "The note has been removed." });
  };


  const handleFileChange = async (selectedFile: File | null) => {
    resetAllResults(); 
    setError(null);

    if (!selectedFile) {
      setFile(null);
      setInputText(null);
      // Consider what inputMode should be. If file is null, 'file' mode processing won't run.
      // setInputMode('file'); // Or keep previous mode? Let's default to 'file' for clarity.
      return;
    }

    setFile(selectedFile); // Keep a reference to the original file for UI display
    setInputText(null);    // Clear any pasted text

    const docxMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const isDocx = selectedFile.type === docxMimeType || selectedFile.name.toLowerCase().endsWith('.docx');

    if (isDocx) {
      setIsExtractingDocx(true);
      setProgressMessage('Extracting text from DOCX...');
      toast({ title: "Processing DOCX", description: "Extracting text from your Word document...", duration: 5000 });
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        
        // Use handleTextChange to set inputText and inputMode to 'text'
        handleTextChange(result.value || ''); 
        // handleTextChange clears 'file' and sets 'inputText', but we want to keep 'file' for display.
        // So, we set it again here. handleTextChange would have set it to null.
        setFile(selectedFile); 

        toast({ title: "DOCX Processed", description: "Text extracted. Ready to generate insights." });
      } catch (e) {
        console.error('Error extracting DOCX:', e);
        const errorMsg = (e as Error).message || "Unknown error during DOCX extraction.";
        setError(`Failed to extract text from DOCX: ${errorMsg}`);
        toast({ title: "DOCX Extraction Error", description: errorMsg, variant: "destructive" });
        setFile(null); 
        setInputMode('file'); // Revert to file mode if extraction fails
      } finally {
        setIsExtractingDocx(false);
        setProgressMessage(null);
      }
    } else if (selectedFile.type === 'application/pdf' || selectedFile.type === 'text/plain') {
      setInputMode('file'); // Set mode to 'file' for AI processing of PDF/TXT
    } else {
      setError(`Unsupported file type: ${selectedFile.name}. Please upload PDF, TXT, or DOCX.`);
      toast({ title: "Unsupported File", description: `File type for ${selectedFile.name} is not supported. Only PDF, TXT, and DOCX are allowed.`, variant: "destructive" });
      setFile(null);
      setInputMode('file'); // Revert to file mode
    }
  };
  

  const handleTextChange = (text: string) => {
    resetAllResults();
    setInputText(text);
    setFile(null); 
    if (text || text === '') { // Allow empty string to set mode to text
        setInputMode('text'); 
    }
  };

  const handleInputModeChange = (mode: 'file' | 'text') => {
    resetAllResults(); // Reset results when mode changes
    setInputMode(mode);
     if (mode === 'file') {
      setInputText(null); 
    } else {
      // Keep file if it was just extracted from DOCX, but allow clearing if user types
      // No, if user explicitly switches to text mode, clear the file.
      setFile(null); 
    }
  };

  const readFileAsDataURL = (fileToRead: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (errorMsg) => reject(errorMsg);
      reader.readAsDataURL(fileToRead);
    });
  };

  const processInput = async () => {
    if (inputMode === 'file' && !file) {
      setError('Please select a file first.');
      toast({ title: "Error", description: "Please select a file.", variant: "destructive" });
      return;
    }
    if (inputMode === 'text' && (inputText === null || inputText.trim() === '')) {
      setError('Please paste some text first.');
      toast({ title: "Error", description: "Please paste or ensure text is not empty.", variant: "destructive" });
      return;
    }
    if (isExtractingDocx) {
      setError('Still extracting text from DOCX. Please wait.');
      toast({ title: "Busy", description: "Still extracting text from DOCX. Please wait.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    setError(null);
    // resetAllResults(); // This is now called by handleFileChange/handleTextChange/handleInputModeChange
    setProgressValue(0);
    setProgressMessage('Starting process...');
    toast({ title: "Processing Started", description: "Your content is being analyzed."});

    let generatedNotesText: string | null = null;
    let noteGenerationSkipped = false;

    try {
      // Step 1: Generate or set notes
      if (inputMode === 'file' && file) { // This implies PDF or TXT that needs AI processing
        const dataUri = await readFileAsDataURL(file);
        setProgressMessage('Generating notes from file...');
        setProgressValue(10);
        toast({ title: "Processing", description: "Generating notes from file..."});
        try {
          const notesOutput = await generateNotes({ documentDataUri: dataUri });
          setNotes(notesOutput.notes); 
          generatedNotesText = notesOutput.notes;
          toast({ title: "Notes Generated", description: "Study notes created successfully from file." });
        } catch (e) {
          console.error('Error generating notes from file:', e);
          const noteErrorMsg = (e as Error).message || "Unknown error during note generation.";
          setError(`Failed to generate notes: ${noteErrorMsg}`);
          toast({ title: "Error Generating Notes", description: noteErrorMsg, variant: "destructive"});
          setIsProcessing(false);
          setProgressValue(0);
          setProgressMessage('Processing failed.');
          setNotes(null); 
          return;
        }
      } else if (inputMode === 'text' && inputText !== null) { // Handles pasted text AND extracted DOCX
        setProgressMessage('Using provided text as notes...');
        setProgressValue(10); // Still count as a step, but it's faster
        generatedNotesText = inputText;
        setNotes(generatedNotesText); 
        noteGenerationSkipped = true;
        toast({ title: "Notes Set", description: "Text will be used for insights." });
      }

      if (!generatedNotesText) {
        setError('Failed to obtain notes content for processing.');
        toast({ title: "Processing Error", description: "Could not get notes content.", variant: "destructive" });
        setIsProcessing(false);
        return;
      }

      // Step 2: Generate Summary
      const summaryBaseProgress = noteGenerationSkipped ? 15 : 30;
      setProgressMessage('Generating summary...');
      setProgressValue(summaryBaseProgress);
      const summaryInput: SummarizeDocumentInput = {
        documentContent: generatedNotesText,
        summaryLength: enableSummaryCustomization ? summaryLength : 'medium',
        summaryStyle: enableSummaryCustomization ? summaryStyle : 'paragraph',
      };
      if (enableSummaryCustomization) {
        toast({ title: "Processing", description: `Generating summary (Length: ${summaryLength}, Style: ${summaryStyle})...`});
      } else {
        toast({ title: "Processing", description: `Generating default summary...`});
      }
      try {
        const summaryOutput = await summarizeDocument(summaryInput);
        setSummary(summaryOutput.summary);
        toast({ title: "Summary Generated", description: "Document summary created successfully." });
      } catch (e) {
        console.error('Error generating summary:', e);
        const summaryErrorMsg = (e as Error).message || "Could not generate summary, but other outputs might be available.";
        // Don't set top-level error for this, allow other results to show
        toast({ title: "Summary Generation Issue", description: summaryErrorMsg, variant: "default"});
      }
      
      // Step 3: Generate Flashcards
      const flashcardsBaseProgress = noteGenerationSkipped ? 40 : 60;
      setProgressMessage('Generating flashcards...');
      setProgressValue(flashcardsBaseProgress);
      toast({ title: "Processing", description: "Generating flashcards..."});
      try {
        const flashcardsOutput = await generateFlashcards({ documentContent: generatedNotesText });
        setFlashcards(flashcardsOutput.flashcards);
        toast({ title: "Flashcards Generated", description: "Flashcards created successfully." });
      } catch (e) {
        console.error('Error generating flashcards:', e);
        const flashcardErrorMsg = (e as Error).message || "Could not generate flashcards.";
        toast({ title: "Flashcard Generation Issue", description: flashcardErrorMsg, variant: "default"});
      }

      // Step 4: Extract Key Concepts
      const conceptsBaseProgress = noteGenerationSkipped ? 70 : 80;
      setProgressMessage('Extracting key concepts...');
      setProgressValue(conceptsBaseProgress);
      toast({ title: "Processing", description: "Extracting key concepts..."});
      try {
        const conceptsOutput = await extractKeyConcepts({ documentContent: generatedNotesText });
        setKeyConcepts(conceptsOutput.concepts);
        toast({ title: "Key Concepts Extracted", description: "Key concepts identified successfully." });
      } catch (e) {
        console.error('Error extracting key concepts:', e);
        const conceptsErrorMsg = (e as Error).message || "Could not extract key concepts.";
        toast({ title: "Key Concept Extraction Issue", description: conceptsErrorMsg, variant: "default"});
      }
      
      setProgressMessage('Process complete!');
      setProgressValue(100);
      toast({ title: "Processing Complete!", description: "All available insights have been generated." });

    } catch (err) {
      console.error('Processing error:', err);
      const errorMessage = (err instanceof Error) ? err.message : 'An unknown error occurred during processing.';
      setError(errorMessage);
      toast({ title: "Processing Error", description: errorMessage, variant: "destructive" });
      setProgressMessage('Processing failed.');
      setNotes(null); // Clear notes on major failure
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAskQuestion = async (question: string) => {
    if (!notes) {
      setQaError("Notes are not available to answer questions. Please process a document or paste text first.");
      toast({ title: "Q&A Error", description: "Notes not available.", variant: "destructive" });
      return;
    }
    if (!question.trim()) {
      setQaError("Please enter a question.");
      toast({ title: "Q&A Error", description: "Question cannot be empty.", variant: "destructive" });
      return;
    }

    setIsAskingQuestion(true);
    setQaAnswer(null);
    setQaError(null);
    toast({ title: "Q&A", description: "Asking your question..." });

    try {
      const output = await answerQuestionFromDocument({ notesContent: notes, userQuestion: question });
      setQaAnswer(output.answer);
      toast({ title: "Q&A", description: "Answer received."});
    } catch (err) {
      console.error('Error answering question:', err);
      const errorMessage = (err instanceof Error) ? err.message : 'An unknown error occurred while answering the question.';
      setQaError(errorMessage);
      toast({ title: "Q&A Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsAskingQuestion(false);
    }
  };

  const handleRequestExplanation = async (textToExplain: string) => {
    if (!textToExplain.trim()) {
      toast({ title: "ELI5 Error", description: "No text selected or provided to explain.", variant: "destructive" });
      return;
    }
    setEli5OriginalText(textToExplain);
    setEli5Explanation(null);
    setEli5Error(null);
    setIsProcessingEli5(true);
    setIsEli5DialogOpen(true);
    toast({ title: "ELI5", description: "Generating simple explanation..." });

    try {
      const output: ExplainTextOutput = await explainTextInSimpleTerms({ textToExplain });
      setEli5Explanation(output.explanation);
    } catch (err) {
      console.error('Error explaining text:', err);
      const errorMessage = (err instanceof Error) ? err.message : 'An unknown error occurred while explaining the text.';
      setEli5Error(errorMessage);
    } finally {
      setIsProcessingEli5(false);
    }
  };


  const resultsAvailable = summary || notes || flashcards || keyConcepts;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center w-full">
        
        <Card className="w-full max-w-2xl mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl sm:text-2xl">
              <Settings2 className="mr-2 h-6 w-6 text-primary" />
              Customize Your Output
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="summary-customization-toggle"
                checked={enableSummaryCustomization}
                onCheckedChange={setEnableSummaryCustomization}
                disabled={isProcessing || isExtractingDocx}
              />
              <Label htmlFor="summary-customization-toggle" className="font-medium">Enable Summary Customization</Label>
            </div>

            {enableSummaryCustomization && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/60">
                <div>
                  <Label htmlFor="summary-length" className="mb-1 block font-medium">Summary Length</Label>
                  <Select
                    value={summaryLength}
                    onValueChange={(value) => setSummaryLength(value as SummaryLength)}
                    disabled={isProcessing || isExtractingDocx}
                  >
                    <SelectTrigger id="summary-length">
                      <SelectValue placeholder="Select length" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="comprehensive">Comprehensive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="summary-style" className="mb-1 block font-medium">Summary Style</Label>
                  <Select
                    value={summaryStyle}
                    onValueChange={(value) => setSummaryStyle(value as SummaryStyle)}
                    disabled={isProcessing || isExtractingDocx}
                  >
                    <SelectTrigger id="summary-style">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paragraph">Paragraph</SelectItem>
                      <SelectItem value="bullet_points">Bullet Points</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
             <div className="flex items-start p-3 space-x-2 text-xs text-muted-foreground bg-accent/30 rounded-md border border-accent">
                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                <p>
                  Enabling customization affects summary generation. If disabled, a default summary will be generated. 
                  Other outputs like notes, flashcards and key concepts are not affected by these settings.
                </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="w-full max-w-2xl mb-12">
           <FileUpload 
            onFileChange={handleFileChange} 
            onTextChange={handleTextChange}
            onInputModeChange={handleInputModeChange}
            inputMode={inputMode}
            inputText={inputText}
            onProcess={processInput} 
            isProcessing={isProcessing}
            isExtractingDocx={isExtractingDocx}
            selectedFile={file}
          />
        </div>

        {(isProcessing || isExtractingDocx) && (
          <div className="w-full max-w-2xl my-8 space-y-2">
            <Progress value={progressValue} className="w-full" />
            {progressMessage && <p className="text-sm text-center text-muted-foreground">{progressMessage}</p>}
          </div>
        )}

        {error && !isProcessing && !isExtractingDocx && (
          <Alert variant="destructive" className="w-full max-w-2xl my-8">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {(resultsAvailable || notes) && !isProcessing && !isExtractingDocx && (
          <div className="w-full max-w-3xl">
            <ResultsTabs 
              summary={summary} 
              notes={notes} 
              flashcards={flashcards}
              keyConcepts={keyConcepts}
              isProcessingKeyConcepts={isProcessing && progressValue >= (noteGenerationSkipped ? 70 : 80) && progressValue < 100} 
              keyConceptsError={null} 
              onAskQuestion={handleAskQuestion}
              qaAnswer={qaAnswer}
              isAskingQuestion={isAskingQuestion}
              qaError={qaError}
              highlightedSegments={highlightedSegments}
              onToggleHighlight={handleToggleHighlight}
              annotations={annotations}
              onAddOrUpdateAnnotation={handleAddOrUpdateAnnotation}
              onRemoveAnnotation={handleRemoveAnnotation}
              onRequestExplanation={handleRequestExplanation}
            />
          </div>
        )}

        <Dialog open={isEli5DialogOpen} onOpenChange={setIsEli5DialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Brain className="mr-2 h-5 w-5 text-primary" />
                Simplified Explanation (ELI5)
              </DialogTitle>
              {eli5OriginalText && (
                <DialogDescription className="pt-2">
                  Original text: "<em>{eli5OriginalText.length > 100 ? eli5OriginalText.substring(0, 100) + '...' : eli5OriginalText}</em>"
                </DialogDescription>
              )}
            </DialogHeader>
            <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {isProcessingEli5 && (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <p className="text-muted-foreground">Generating explanation...</p>
                </div>
              )}
              {eli5Error && !isProcessingEli5 && (
                <Alert variant="destructive">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Error Explaining Text</AlertTitle>
                  <AlertDescription>{eli5Error}</AlertDescription>
                </Alert>
              )}
              {eli5Explanation && !isProcessingEli5 && (
                <div className="p-3 bg-accent/50 rounded-md border">
                  <p className="text-sm whitespace-pre-wrap">{eli5Explanation}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border/40">
        © {new Date().getFullYear()} NoteWise. All rights reserved.
      </footer>
    </div>
  );
}

