import React, { useEffect, useState, useRef } from 'react';
import spinnerImage from '../assets/images/spinner.png';

const THINKING_MESSAGES = [
  'Thinking...',
  "I'm still on it...",
  'Almost there...',
  'Taking a bit more time...',
];

interface LoadingIndicatorProps {
  visible: boolean;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ visible }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      // Cycle through thinking messages every 5 seconds
      intervalRef.current = setInterval(() => {
        // Fade out
        setFadeIn(false);

        // Wait for fade out to complete, then change message and fade in
        fadeTimeoutRef.current = setTimeout(() => {
          setCurrentMessageIndex((prev) => (prev + 1) % THINKING_MESSAGES.length);
          setFadeIn(true);
        }, 500); // Match the CSS transition duration
      }, 5000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        if (fadeTimeoutRef.current) {
          clearTimeout(fadeTimeoutRef.current);
        }
      };
    } else {
      // Reset state when not visible
      setCurrentMessageIndex(0);
      setFadeIn(true);
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <div className="flex items-center gap-5 w-full">
      {/* Spinning and pulsing logo */}
      <div
        className="flex-shrink-0"
        style={{
          width: '24px',
          height: '24px',
        }}
      >
        <img
          src={spinnerImage}
          alt="Loading..."
          className="w-full h-full"
          style={{
            animation: 'spin-pulse 3s ease-in-out infinite',
          }}
        />
      </div>

      {/* Thinking message with fade animation */}
      <div
        className="text-sm italic transition-opacity duration-500"
        style={{
          fontFamily: 'Styrene-B',
          color: 'rgba(255, 255, 255, 0.6)',
          opacity: fadeIn ? 1 : 0,
        }}
      >
        {THINKING_MESSAGES[currentMessageIndex]}
      </div>

      {/* Add keyframe animation styles */}
      <style>{`
        @keyframes spin-pulse {
          0% {
            transform: rotate(0deg) scale(1);
          }
          25% {
            transform: rotate(90deg) scale(1.1);
          }
          50% {
            transform: rotate(180deg) scale(1);
          }
          75% {
            transform: rotate(270deg) scale(1.1);
          }
          100% {
            transform: rotate(360deg) scale(1);
          }
        }
      `}</style>
    </div>
  );
};
