
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface FlashcardProps {
  question: string;
  answer: string;
  // Key is implicitly handled by parent to reset state on card change
}

export function Flashcard({ question, answer }: FlashcardProps) {
  const [showAnswer, setShowAnswer] = useState(false);

  // Reset showAnswer state when question changes (i.e., new card)
  useEffect(() => {
    setShowAnswer(false);
  }, [question]);

  const toggleAnswer = () => {
    setShowAnswer(prev => !prev);
  };

  return (
    <Card className="w-full min-h-[20rem] shadow-xl flex flex-col">
      <CardContent className="p-6 flex-grow flex flex-col justify-center items-center text-center">
        <div>
          <h3 className="text-lg font-semibold font-headline mb-2">Question:</h3>
          <p className="text-md font-body">{question}</p>
        </div>
        
        {showAnswer && (
          <div className="mt-6 pt-4 border-t border-border w-full">
            <h3 className="text-lg font-semibold font-headline mb-2">Answer:</h3>
            <p className="text-md font-body text-accent-foreground">{answer}</p>
          </div>
        )}
      </CardContent>
      <div className="p-4 border-t border-border flex justify-center">
        <Button onClick={toggleAnswer} variant="outline" className="w-1/2">
          {showAnswer ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
          {showAnswer ? 'Hide Answer' : 'Show Answer'}
        </Button>
      </div>
    </Card>
  );
}
