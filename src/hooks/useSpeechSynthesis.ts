
'use client';

import { useState, useEffect, useCallback } from 'react';

interface SpeechSynthesisHook {
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  speak: (text: string, lang?: string) => void;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
}

export function useSpeechSynthesis(): SpeechSynthesisHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
      const u = new SpeechSynthesisUtterance();
      u.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };
      u.onpause = () => {
        setIsSpeaking(true); // Still speaking, but paused
        setIsPaused(true);
      };
      u.onresume = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };
      u.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };
      u.onerror = (event: Event) => {
        // The event is actually SpeechSynthesisErrorEvent
        const errorEvent = event as SpeechSynthesisErrorEvent;
        console.error('SpeechSynthesisUtterance.onerror - Error:', errorEvent.error, 'Event Object:', errorEvent);
        setIsSpeaking(false);
        setIsPaused(false);
      };
      setUtterance(u);

      // Cleanup: cancel speech if component unmounts
      return () => {
        window.speechSynthesis.cancel();
      };
    }
  }, []);

  const speak = useCallback((text: string, lang: string = 'en-US') => {
    if (!isSupported || !utterance || !window.speechSynthesis) return;
    
    // If already speaking, cancel previous before starting new
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    utterance.text = text;
    utterance.lang = lang;
    utterance.voice = window.speechSynthesis.getVoices().find(voice => voice.lang === lang) || null;
    
    window.speechSynthesis.speak(utterance);
  }, [isSupported, utterance]);

  const pause = useCallback(() => {
    if (!isSupported || !window.speechSynthesis.speaking || isPaused) return;
    window.speechSynthesis.pause();
  }, [isSupported, isPaused]);

  const resume = useCallback(() => {
    if (!isSupported || !window.speechSynthesis.speaking || !isPaused) return;
    window.speechSynthesis.resume();
  }, [isSupported, isPaused]);

  const cancel = useCallback(() => {
    if (!isSupported || !window.speechSynthesis.speaking) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, [isSupported]);

  return { isSpeaking, isPaused, isSupported, speak, pause, resume, cancel };
}
