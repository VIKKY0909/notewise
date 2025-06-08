
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { FileText, Play, StopCircle, Download, ClipboardCopy, File as FileIcon, PencilLine, Edit3, Trash2, Lightbulb } from 'lucide-react';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import jsPDF from 'jspdf';
import ReactMarkdown, { type Components } from 'react-markdown';

interface NotesDisplayProps {
  notes: string | null;
  highlightedSegments: string[];
  onToggleHighlight: (segmentKey: string) => void;
  annotations: Record<string, string>;
  onAddOrUpdateAnnotation: (segmentKey: string, text: string) => void;
  onRemoveAnnotation: (segmentKey: string) => void;
  onRequestExplanation: (text: string) => void; 
}

// Helper to extract text content from react-markdown's node structure
const getNodeText = (node: any): string => {
  if (node.type === 'text') {
    return node.value || '';
  }
  if (node.children && Array.isArray(node.children)) {
    return node.children.map(getNodeText).join('');
  }
  return '';
};


export function NotesDisplay({ 
  notes, 
  highlightedSegments, 
  onToggleHighlight,
  annotations = {},
  onAddOrUpdateAnnotation,
  onRemoveAnnotation,
  onRequestExplanation,
}: NotesDisplayProps) {
  const { speak, cancel, isSpeaking, isSupported } = useSpeechSynthesis();
  const { toast } = useToast();
  const markdownContainerRef = useRef<HTMLDivElement>(null);

  const [isAnnotationDialogOpen, setIsAnnotationDialogOpen] = useState(false);
  const [currentSegmentKeyForDialog, setCurrentSegmentKeyForDialog] = useState<string | null>(null);
  const [currentAnnotationTextForDialog, setCurrentAnnotationTextForDialog] = useState('');


  useEffect(() => {
    return () => {
      if (isSpeaking) cancel();
    };
  }, [notes, cancel, isSpeaking]);

  const getPlainText = () => {
    if (!markdownContainerRef.current) return notes || '';
    return markdownContainerRef.current.innerText;
  }

  const handleDownloadTXT = () => {
    const plainText = getPlainText();
    if (!plainText) {
      toast({ title: "Error", description: "No notes content to download.", variant: "destructive"});
      return;
    }
    const element = document.createElement("a");
    const file = new Blob([plainText], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = "notewise-notes.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
    toast({ title: "Downloaded", description: "Notes downloaded as TXT."});
  };

  const handleDownloadPDF = () => {
    const plainTextForPDF = getPlainText();
    if (!plainTextForPDF) {
        toast({ title: "Error", description: "No notes content to download.", variant: "destructive"});
        return;
    }
    
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxLineWidth = pageWidth - margin * 2;
    let y = margin;

    const lines = doc.splitTextToSize(plainTextForPDF, maxLineWidth);

    lines.forEach((line: string) => {
      if (y + 7 > pageHeight - margin) { 
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 7; 
    });
    
    doc.save('notewise-notes.pdf');
    toast({ title: "Downloaded", description: "Notes downloaded as PDF."});
  };

  const handleCopyToClipboard = () => {
    const plainText = getPlainText();
    if (!plainText) {
        toast({ title: "Error", description: "No notes content to copy.", variant: "destructive"});
        return;
    }
    navigator.clipboard.writeText(plainText)
      .then(() => {
        toast({ title: "Copied!", description: "Notes (as plain text) copied to clipboard." });
      })
      .catch(err => {
        console.error('Failed to copy notes: ', err);
        toast({ title: "Copy Failed", description: "Could not copy notes to clipboard.", variant: "destructive" });
      });
  };

  const handleReadAloud = () => {
    const textToRead = getPlainText();
    if (!textToRead) return;
    if (isSpeaking) {
      cancel();
    } else {
      speak(textToRead);
    }
  };
  
  const handleOpenAnnotationDialog = (segmentKey: string) => {
    setCurrentSegmentKeyForDialog(segmentKey);
    setCurrentAnnotationTextForDialog((annotations && annotations[segmentKey]) || '');
    setIsAnnotationDialogOpen(true);
  };

  const handleCloseAnnotationDialog = () => {
    setIsAnnotationDialogOpen(false);
    setCurrentSegmentKeyForDialog(null);
    setCurrentAnnotationTextForDialog('');
  };
  
  const handleSaveAnnotation = () => {
    if (currentSegmentKeyForDialog) {
      onAddOrUpdateAnnotation(currentSegmentKeyForDialog, currentAnnotationTextForDialog);
    }
    handleCloseAnnotationDialog();
  };
  
  const handleDeleteAnnotation = () => {
    if (currentSegmentKeyForDialog) {
      onRemoveAnnotation(currentSegmentKeyForDialog);
    }
    handleCloseAnnotationDialog();
  };

  const createInteractiveRenderer = (elementType: keyof JSX.IntrinsicElements) => {
    // eslint-disable-next-line react/display-name
    return ({ node, children, ...props }: { node: any; children: ReactNode; [key: string]: any }) => {
      const line = node?.position?.start?.line ?? 'unknown';
      const column = node?.position?.start?.column ?? 'unknown';
      const segmentKey = `${elementType}-${line}-${column}`;
      const isHighlighted = highlightedSegments.includes(segmentKey);
      const existingAnnotation = annotations && annotations[segmentKey]; 
      
      const Element = elementType as any;

      const segmentTextForExplanation = getNodeText(node);

      return (
        <div className="my-1 relative group">
          <Element
            {...props}
            className={`${isHighlighted ? 'bg-yellow-300 dark:bg-yellow-700 dark:text-yellow-950 rounded-sm px-1 py-0.5' : ''} cursor-pointer`}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation(); 
              onToggleHighlight(segmentKey);
            }}
          >
            {children}
          </Element>
          {isHighlighted && (
            <div className="mt-1.5 p-2 space-y-2 bg-muted/30 dark:bg-muted/20 rounded border border-border/50 w-full">
              <div className="flex flex-wrap gap-2 items-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="py-0.5 px-1.5 h-auto text-xs border-dashed border-primary/50 hover:border-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenAnnotationDialog(segmentKey);
                  }}
                >
                  {existingAnnotation ? <Edit3 className="mr-1 h-3 w-3" /> : <PencilLine className="mr-1 h-3 w-3" />}
                  {existingAnnotation ? 'Edit Note' : 'Add Note'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="py-0.5 px-1.5 h-auto text-xs border-dashed border-purple-500/50 hover:border-purple-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (segmentTextForExplanation.trim()) {
                      onRequestExplanation(segmentTextForExplanation);
                    } else {
                      toast({title: "Cannot Explain", description: "Segment is empty or contains no text.", variant: "destructive"})
                    }
                  }}
                  title="Explain this segment"
                >
                  <Lightbulb className="mr-1 h-3 w-3" />
                  Explain
                </Button>
              </div>
              {existingAnnotation && (
                <div className="mt-1.5 p-2 text-xs bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-700/50 w-full">
                  <p className="font-semibold text-blue-700 dark:text-blue-300 mb-0.5">Your Note:</p>
                  <p className="whitespace-pre-wrap text-blue-900 dark:text-blue-100">{existingAnnotation}</p>
                </div>
              )}
            </div>
          )}
        </div>
      );
    };
  };

  const customRenderers: Components = {
    p: createInteractiveRenderer('p'),
    h1: createInteractiveRenderer('h1'),
    h2: createInteractiveRenderer('h2'),
    h3: createInteractiveRenderer('h3'),
    h4: createInteractiveRenderer('h4'),
    h5: createInteractiveRenderer('h5'),
    h6: createInteractiveRenderer('h6'),
    li: createInteractiveRenderer('li'),
    blockquote: createInteractiveRenderer('blockquote'),
  };


  if (!notes) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center"><FileText className="mr-2 h-5 w-5 text-primary" /> Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No notes generated or text pasted yet. Provide content to see your notes here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-x-2">
          <CardTitle className="flex items-center"><FileText className="mr-2 h-5 w-5 text-primary" /> Notes</CardTitle>
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            {isSupported && notes && (
              <Button onClick={handleReadAloud} variant="outline" size="sm" aria-label={isSpeaking ? 'Stop reading notes' : 'Read notes aloud'}>
                {isSpeaking ? <StopCircle className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                {isSpeaking ? 'Stop' : 'Read'}
              </Button>
            )}
            {notes && (
              <>
                <Button onClick={handleCopyToClipboard} variant="outline" size="sm" aria-label="Copy notes to clipboard">
                  <ClipboardCopy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button onClick={handleDownloadTXT} variant="outline" size="sm" aria-label="Download notes as TXT">
                  <FileText className="mr-2 h-4 w-4" />
                  TXT
                </Button>
                <Button onClick={handleDownloadPDF} variant="outline" size="sm" aria-label="Download notes as PDF">
                  <FileIcon className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div ref={markdownContainerRef} className="prose prose-sm sm:prose-base dark:prose-invert max-w-none leading-relaxed font-body">
            <ReactMarkdown components={customRenderers}>{notes}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAnnotationDialogOpen} onOpenChange={(open) => {
        if (!open) {
            handleCloseAnnotationDialog();
        } else {
            setIsAnnotationDialogOpen(true); 
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{(annotations && currentSegmentKeyForDialog && annotations[currentSegmentKeyForDialog]) ? 'Edit Note' : 'Add Note'}</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Type your note here..."
            value={currentAnnotationTextForDialog}
            onChange={(e) => setCurrentAnnotationTextForDialog(e.target.value)}
            rows={4}
            className="my-4"
          />
          <DialogFooter className="sm:justify-between">
            <div>
              {(annotations && currentSegmentKeyForDialog && annotations[currentSegmentKeyForDialog]) && (
                <Button variant="destructive" onClick={handleDeleteAnnotation} size="sm">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Note
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={handleCloseAnnotationDialog} size="sm">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="button" onClick={handleSaveAnnotation} size="sm">
                Save Note
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
