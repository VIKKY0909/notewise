
'use client';

import { useState, useEffect, useCallback } from 'react';

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  error: string | null;
  isSupported: boolean;
  startListening: (lang?: string) => void;
  stopListening: () => void;
  clearTranscript: () => void;
}

let recognitionInstance: SpeechRecognition | null = null;

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        setIsSupported(true);
        recognitionInstance = new SpeechRecognitionAPI();
        recognitionInstance.continuous = true; // Keep listening even after a pause
        recognitionInstance.interimResults = true; // Get results as they come

        recognitionInstance.onstart = () => {
          setIsListening(true);
          setError(null);
        };

        recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = '';
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          // For this hook, we'll set the transcript to the latest interim or final result
          setTranscript(finalTranscript || interimTranscript); 
        };
        
        recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('SpeechRecognition.onerror', event);
          setError(event.error);
          setIsListening(false);
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
        };
      } else {
        setIsSupported(false);
        setError("Speech recognition not supported by this browser.");
      }
    }
    // Cleanup
    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
        recognitionInstance.onstart = null;
        recognitionInstance.onresult = null;
        recognitionInstance.onerror = null;
        recognitionInstance.onend = null;
        recognitionInstance = null;
      }
    };
  }, []);

  const startListening = useCallback((lang: string = 'en-US') => {
    if (!isSupported || isListening || !recognitionInstance) return;
    recognitionInstance.lang = lang;
    setTranscript(''); // Clear previous transcript before starting
    try {
      recognitionInstance.start();
    } catch (e: any) {
      setError(e.message || "Failed to start recognition");
      setIsListening(false);
    }
  }, [isSupported, isListening]);

  const stopListening = useCallback(() => {
    if (!isSupported || !isListening || !recognitionInstance) return;
    recognitionInstance.stop();
  }, [isSupported, isListening]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return { isListening, transcript, error, isSupported, startListening, stopListening, clearTranscript };
}
