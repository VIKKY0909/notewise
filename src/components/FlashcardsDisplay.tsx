
'use client';

import React, { useState, useEffect } from 'react';
import { Flashcard } from './Flashcard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';

interface FlashcardData {
  question: string;
  answer: string;
}

interface FlashcardsDisplayProps {
  flashcards: FlashcardData[] | null;
}

export function FlashcardsDisplay({ flashcards }: FlashcardsDisplayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0); 
  }, [flashcards]);

  if (!flashcards || flashcards.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center"><Layers className="mr-2 h-5 w-5 text-primary" /> Flashcards</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No flashcards generated yet. Upload a document to see your flashcards here.</p>
        </CardContent>
      </Card>
    );
  }

  const currentFlashcard = flashcards[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : flashcards.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex < flashcards.length - 1 ? prevIndex + 1 : 0));
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center"><Layers className="mr-2 h-5 w-5 text-primary" /> Flashcards ({currentIndex + 1}/{flashcards.length})</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">
        <div className="w-full max-w-md">
          <Flashcard 
            key={currentIndex} // Ensures component re-mounts and resets internal state on card change
            question={currentFlashcard.question} 
            answer={currentFlashcard.answer} 
          />
        </div>
        <div className="flex space-x-4">
          <Button variant="outline" onClick={goToPrevious} aria-label="Previous flashcard" disabled={flashcards.length <= 1}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="outline" onClick={goToNext} aria-label="Next flashcard" disabled={flashcards.length <= 1}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
