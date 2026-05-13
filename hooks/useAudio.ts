import { useState, useCallback } from 'react';
import * as Speech from 'expo-speech';

export function useAudio() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentText, setCurrentText] = useState('');

  const speak = useCallback((text: string) => {
    Speech.stop();
    setCurrentText(text);
    setIsSpeaking(true);
    setIsPaused(false);

    Speech.speak(text, {
      language: 'es-CO',
      pitch: 1.0,
      rate: 0.9,
      onDone: () => {
        setIsSpeaking(false);
        setIsPaused(false);
      },
      onError: () => {
        setIsSpeaking(false);
        setIsPaused(false);
      },
    });
  }, []);

  const pause = useCallback(async () => {
    try {
      await Speech.pause();
      setIsPaused(true);
    } catch {
      stop();
    }
  }, []);

  const resume = useCallback(async () => {
    try {
      await Speech.resume();
      setIsPaused(false);
    } catch {
      if (currentText) speak(currentText);
    }
  }, [currentText, speak]);

  const stop = useCallback(() => {
    Speech.stop();
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  const repeat = useCallback(() => {
    if (currentText) speak(currentText);
  }, [currentText, speak]);

  return {
    isSpeaking,
    isPaused,
    speak,
    pause,
    resume,
    stop,
    repeat,
  };
}
