
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, ListTree } from 'lucide-react';
import type { ExtractKeyConceptsOutput } from '@/ai/flows/extract-key-concepts';

interface KeyConceptsDisplayProps {
  concepts: ExtractKeyConceptsOutput['concepts'] | null;
  isLoading: boolean;
  error: string | null;
}

export function KeyConceptsDisplay({ concepts, isLoading, error }: KeyConceptsDisplayProps) {
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center"><ListTree className="mr-2 h-5 w-5 text-primary" /> Key Concepts</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Extracting key concepts...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center"><ListTree className="mr-2 h-5 w-5 text-primary" /> Key Concepts</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Extracting Key Concepts</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!concepts || concepts.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center"><ListTree className="mr-2 h-5 w-5 text-primary" /> Key Concepts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No key concepts were extracted from the document, or the document might be too short.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center"><ListTree className="mr-2 h-5 w-5 text-primary" /> Key Concepts & Definitions</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {concepts.map((concept, index) => (
            <AccordionItem value={`item-${index}`} key={index}>
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="font-medium text-base">{concept.term}</span>
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none pt-1 pb-3">
                <p className="text-foreground/90 whitespace-pre-wrap">{concept.definition}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
