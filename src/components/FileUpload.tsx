
'use client';

import type React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UploadCloud, FileText, Type, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  onTextChange: (text: string) => void;
  onProcess: () => void;
  isProcessing: boolean;
  isExtractingDocx: boolean; // New prop
  selectedFile: File | null;
  inputText: string | null;
  inputMode: 'file' | 'text';
  onInputModeChange: (mode: 'file' | 'text') => void;
}

export function FileUpload({
  onFileChange,
  onTextChange,
  onProcess,
  isProcessing,
  isExtractingDocx, // New prop
  selectedFile,
  inputText,
  inputMode,
  onInputModeChange,
}: FileUploadProps) {
  const handleFileChangeInternal = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    onFileChange(file);
  };

  const handleTextChangeInternal = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onTextChange(event.target.value);
  };

  const canProcess = (!isProcessing && !isExtractingDocx && ((inputMode === 'file' && selectedFile) || (inputMode === 'text' && inputText && inputText.trim() !== '')));
  const isButtonDisabled = isProcessing || isExtractingDocx || !canProcess;

  return (
    <div className="w-full p-4 sm:p-6 space-y-6 bg-card rounded-xl shadow-lg mx-auto">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-headline font-semibold tracking-tight">Provide Your Content</h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          Upload a PDF, TXT, or DOCX file, or paste your text directly.
        </p>
      </div>

      <RadioGroup
        value={inputMode}
        onValueChange={(value: 'file' | 'text') => onInputModeChange(value)}
        className="flex justify-center space-x-4 mb-4"
        disabled={isProcessing || isExtractingDocx}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="file" id="mode-file" />
          <Label htmlFor="mode-file" className="flex items-center gap-2 cursor-pointer">
            <FileText className="h-4 w-4" /> Upload File
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="text" id="mode-text" />
          <Label htmlFor="mode-text" className="flex items-center gap-2 cursor-pointer">
            <Type className="h-4 w-4" /> Paste Text
          </Label>
        </div>
      </RadioGroup>

      <div className="space-y-4">
        {inputMode === 'file' && (
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="document-upload" className="sr-only">Upload Document</Label>
            <Input
              id="document-upload"
              type="file"
              accept=".pdf,.txt,.docx"
              onChange={handleFileChangeInternal}
              className="file:text-primary file:font-medium"
              disabled={isProcessing || isExtractingDocx}
            />
            {selectedFile && (
              <div className="flex items-center p-3 space-x-3 text-sm border rounded-md bg-background mt-2">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <span className="flex-1 truncate">{selectedFile.name}</span>
                <span className="text-muted-foreground">{(selectedFile.size / 1024).toFixed(2)} KB</span>
              </div>
            )}
          </div>
        )}

        {inputMode === 'text' && (
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="text-input" className="sr-only">Paste Text</Label>
            <Textarea
              id="text-input"
              placeholder="Paste your document content here..."
              value={inputText || ''}
              onChange={handleTextChangeInternal}
              rows={8}
              className="text-base"
              disabled={isProcessing || isExtractingDocx}
            />
            {inputText !== null && (
               <p className="text-xs text-muted-foreground text-right">{inputText.length} characters</p>
            )}
          </div>
        )}

        <Button
          onClick={onProcess}
          disabled={isButtonDisabled}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : isExtractingDocx ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Extracting Text...
            </>
          ) : (
            <>
              <UploadCloud className="mr-2 h-5 w-5" />
              Generate Insights
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
