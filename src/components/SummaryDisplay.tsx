
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, Play, StopCircle, Download, ClipboardCopy, File, FileText } from 'lucide-react';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import jsPDF from 'jspdf';

interface SummaryDisplayProps {
  summary: string | null;
}

export function SummaryDisplay({ summary }: SummaryDisplayProps) {
  const { speak, cancel, isSpeaking, isSupported } = useSpeechSynthesis();
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      cancel();
    };
  }, [summary, cancel]);

  const handleDownloadTXT = () => {
    if (!summary) return;
    const element = document.createElement("a");
    const file = new Blob([summary], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = "notewise-summary.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
    toast({ title: "Downloaded", description: "Summary downloaded as TXT."});
  };
  
  const handleDownloadPDF = () => {
    if (!summary) return;
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxLineWidth = pageWidth - margin * 2;
    let y = margin;

    const lines = doc.splitTextToSize(summary, maxLineWidth);

    lines.forEach((line: string) => {
      if (y + 10 > pageHeight - margin) { // 10 is an approximate line height
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 7; // Line height
    });
    
    doc.save('notewise-summary.pdf');
    toast({ title: "Downloaded", description: "Summary downloaded as PDF."});
  };

  const handleCopyToClipboard = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary)
      .then(() => {
        toast({ title: "Copied!", description: "Summary copied to clipboard." });
      })
      .catch(err => {
        console.error('Failed to copy summary: ', err);
        toast({ title: "Copy Failed", description: "Could not copy summary to clipboard.", variant: "destructive" });
      });
  };

  if (!summary) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center"><ClipboardList className="mr-2 h-5 w-5 text-primary" /> Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No summary generated yet. Provide content to see the summary here.</p>
        </CardContent>
      </Card>
    );
  }

  const handleReadAloud = () => {
    if (isSpeaking) {
      cancel();
    } else {
      speak(summary);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-x-2">
        <CardTitle className="flex items-center"><ClipboardList className="mr-2 h-5 w-5 text-primary" /> Summary</CardTitle>
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          {isSupported && summary && (
            <Button onClick={handleReadAloud} variant="outline" size="sm" aria-label={isSpeaking ? 'Stop reading summary' : 'Read summary aloud'}>
              {isSpeaking ? <StopCircle className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {isSpeaking ? 'Stop' : 'Read'}
            </Button>
          )}
          {summary && (
            <>
              <Button onClick={handleCopyToClipboard} variant="outline" size="sm" aria-label="Copy summary to clipboard">
                <ClipboardCopy className="mr-2 h-4 w-4" />
                Copy
              </Button>
              <Button onClick={handleDownloadTXT} variant="outline" size="sm" aria-label="Download summary as TXT">
                <FileText className="mr-2 h-4 w-4" /> 
                TXT
              </Button>
              <Button onClick={handleDownloadPDF} variant="outline" size="sm" aria-label="Download summary as PDF">
                <File className="mr-2 h-4 w-4" />
                PDF
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <pre className="whitespace-pre-wrap text-sm leading-relaxed font-body">{summary}</pre>
      </CardContent>
    </Card>
  );
}
