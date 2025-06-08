
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HelpCircle, Send, Loader2, Terminal, Mic, MicOff, Play, StopCircle } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';

interface QADisplayProps {
  onAskQuestion: (question: string) => Promise<void>;
  answer: string | null;
  isAsking: boolean;
  qaError: string | null;
  notesAvailable: boolean;
}

export function QADisplay({
  onAskQuestion,
  answer,
  isAsking,
  qaError,
  notesAvailable,
}: QADisplayProps) {
  const [question, setQuestion] = useState('');

  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    clearTranscript,
    isSupported: sttIsSupported,
    error: sttError,
  } = useSpeechRecognition();

  const {
    speak: speakAnswer,
    cancel: cancelAnswer,
    isSpeaking: isAnswerSpeaking,
    isSupported: ttsIsSupported,
  } = useSpeechSynthesis();

  useEffect(() => {
    if (transcript) {
      setQuestion(transcript);
    }
  }, [transcript]);
  
  useEffect(() => {
    // Automatically read the answer when it arrives and is not currently being asked
    if (answer && !isAsking && ttsIsSupported) {
      speakAnswer(answer);
    }
    // Cleanup: if component unmounts or answer changes, stop speaking previous answer.
    return () => {
      if(ttsIsSupported) cancelAnswer();
    };
  }, [answer, isAsking, ttsIsSupported, speakAnswer, cancelAnswer]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !notesAvailable) return;
    if (isListening) stopListening(); // Stop listening if user submits manually
    clearTranscript(); // Clear transcript after submitting
    await onAskQuestion(question);
    // setQuestion(''); // Optionally clear question input after submission
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      setQuestion(''); // Clear text area when starting new voice input
      clearTranscript();
      startListening();
    }
  };
  
  const handleToggleAnswerSpeech = () => {
    if (!answer) return;
    if (isAnswerSpeaking) {
      cancelAnswer();
    } else {
      speakAnswer(answer);
    }
  };


  if (!notesAvailable) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <HelpCircle className="mr-2 h-5 w-5 text-primary" /> Q&A
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please upload and process a document first to generate notes. You can then ask questions based on the notes.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <HelpCircle className="mr-2 h-5 w-5 text-primary" /> Ask a Question
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Textarea
              placeholder={isListening ? "Listening..." : "Type or click the mic to ask your question..."}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              className="text-base pr-12" 
              disabled={isAsking || !notesAvailable}
            />
            {sttIsSupported && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleListening}
                className="absolute right-2 top-1/2 -translate-y-1/2"
                disabled={isAsking || !notesAvailable}
                title={isListening ? "Stop listening" : "Ask with voice"}
              >
                {isListening ? <MicOff className="h-5 w-5 text-red-500" /> : <Mic className="h-5 w-5" />}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Ask questions based on the generated notes.</p>
          <Button type="submit" disabled={!question.trim() || isAsking || !notesAvailable || isListening} className="w-full sm:w-auto">
            {isAsking ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Ask Question
          </Button>
        </form>

        {sttError && (
           <Alert variant="destructive" className="mt-2">
             <Terminal className="h-4 w-4" />
             <AlertTitle>Speech Recognition Error</AlertTitle>
             <AlertDescription>{sttError}</AlertDescription>
           </Alert>
         )}

        {isAsking && !answer && (
          <div className="flex items-center justify-center p-4 rounded-md border border-dashed">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
            <p className="text-muted-foreground">Getting your answer...</p>
          </div>
        )}

        {qaError && (
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error Answering Question</AlertTitle>
            <AlertDescription>{qaError}</AlertDescription>
          </Alert>
        )}

        {answer && !isAsking && (
          <div className="p-4 bg-accent/50 rounded-md border space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-accent-foreground">Answer:</h4>
              {ttsIsSupported && (
                <Button onClick={handleToggleAnswerSpeech} variant="outline" size="sm">
                  {isAnswerSpeaking ? <StopCircle className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                  {isAnswerSpeaking ? 'Stop' : 'Replay'}
                </Button>
              )}
            </div>
            <pre className="whitespace-pre-wrap text-sm leading-relaxed font-body text-foreground">
              {answer}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
