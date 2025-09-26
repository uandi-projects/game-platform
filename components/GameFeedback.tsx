"use client";

import { useEffect } from "react";

interface GameFeedbackProps {
  soundFeedback: boolean;
  hapticFeedback: boolean;
  isCorrect: boolean;
  onFeedbackComplete?: () => void;
}

export default function GameFeedback({
  soundFeedback,
  hapticFeedback,
  isCorrect,
  onFeedbackComplete,
}: GameFeedbackProps) {
  useEffect(() => {
    if (soundFeedback) {
      playSound(isCorrect);
    }

    if (hapticFeedback) {
      triggerHaptic(isCorrect);
    }

    if (onFeedbackComplete) {
      const timer = setTimeout(onFeedbackComplete, 300);
      return () => clearTimeout(timer);
    }
  }, [soundFeedback, hapticFeedback, isCorrect, onFeedbackComplete]);

  return null;
}

// Audio feedback functions
function playSound(isCorrect: boolean) {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    if (isCorrect) {
      playCorrectSound(audioContext);
    } else {
      playIncorrectSound(audioContext);
    }
  } catch (error) {
    console.warn("Audio feedback not supported:", error);
  }
}

function playCorrectSound(audioContext: AudioContext) {
  // Play a pleasant ascending tone for correct answers
  const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 - major chord
  frequencies.forEach((freq, index) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime + index * 0.1);
    oscillator.stop(audioContext.currentTime + 0.3 + index * 0.1);
  });
}

function playIncorrectSound(audioContext: AudioContext) {
  // Play a descending tone for incorrect answers
  const frequencies = [349.23, 293.66]; // F4, D4 - minor interval
  frequencies.forEach((freq, index) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
    oscillator.type = "square";

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime + index * 0.1);
    oscillator.stop(audioContext.currentTime + 0.2 + index * 0.1);
  });
}

// Haptic feedback functions
function triggerHaptic(isCorrect: boolean) {
  if (!navigator.vibrate) {
    return;
  }

  try {
    if (isCorrect) {
      // Short double pulse for correct answers
      navigator.vibrate([50, 50, 50]);
    } else {
      // Longer single pulse for incorrect answers
      navigator.vibrate([200]);
    }
  } catch (error) {
    console.warn("Haptic feedback not supported:", error);
  }
}

// Hook for using game feedback
export function useGameFeedback(
  soundFeedback: boolean,
  hapticFeedback: boolean
) {
  const triggerFeedback = (isCorrect: boolean, onComplete?: () => void) => {
    if (soundFeedback) {
      playSound(isCorrect);
    }

    if (hapticFeedback) {
      triggerHaptic(isCorrect);
    }

    if (onComplete) {
      setTimeout(onComplete, 300);
    }
  };

  return { triggerFeedback };
}