import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TranscriptionOverlayProps {
    userText: string;
    agentText: string;
    isDrawerOpen?: boolean;
}

/**
 * TranscriptionOverlay - Simplified Block Display
 *
 * Accumulates consecutive agent messages into one block.
 * Displays with fade in/out animation.
 * Supports multi-line text wrapping.
 */
export const TranscriptionOverlay: React.FC<TranscriptionOverlayProps> = ({
    userText,
    agentText,
    isDrawerOpen = false
}) => {
    // Display state
    const [displayText, setDisplayText] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const [isAgentText, setIsAgentText] = useState(false);

    // Refs
    const accumulatedTextRef = useRef<string>('');
    const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const clearFadeTimeout = useCallback(() => {
        if (fadeTimeoutRef.current) {
            clearTimeout(fadeTimeoutRef.current);
            fadeTimeoutRef.current = null;
        }
    }, []);

    // Handle agent text - accumulate consecutive messages
    useEffect(() => {
        if (!agentText) {
            // Agent stopped - schedule fade out after 2 seconds
            if (isVisible && isAgentText) {
                fadeTimeoutRef.current = setTimeout(() => {
                    setIsVisible(false);
                    setDisplayText('');
                    accumulatedTextRef.current = '';
                }, 2000);
            }
            return;
        }

        // Clear any pending fade
        clearFadeTimeout();

        // Accumulate agent text (append if new, don't duplicate)
        const newText = agentText.trim();
        if (!accumulatedTextRef.current.includes(newText)) {
            accumulatedTextRef.current = accumulatedTextRef.current
                ? `${accumulatedTextRef.current} ${newText}`
                : newText;
        }

        setDisplayText(accumulatedTextRef.current);
        setIsAgentText(true);
        setIsVisible(true);
    }, [agentText, isVisible, isAgentText, clearFadeTimeout]);

    // Handle user text - replaces agent text
    useEffect(() => {
        if (userText) {
            // Clear agent accumulated text
            accumulatedTextRef.current = '';

            // Clear any pending fade
            clearFadeTimeout();

            setDisplayText(userText.trim());
            setIsAgentText(false);
            setIsVisible(true);

            // User text fades out after 2 seconds
            fadeTimeoutRef.current = setTimeout(() => {
                setIsVisible(false);
                setDisplayText('');
            }, 2000);
        }
    }, [userText, clearFadeTimeout]);

    // Cleanup on unmount
    useEffect(() => {
        return () => clearFadeTimeout();
    }, [clearFadeTimeout]);

    // Dynamic bottom position based on drawer state
    const bottomPosition = isDrawerOpen ? 220 : 140;

    return (
        <AnimatePresence mode="wait">
            {isVisible && displayText && (
                <motion.div
                    key={isAgentText ? 'agent' : 'user'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    style={{
                        position: 'fixed',
                        bottom: bottomPosition,
                        left: 0,
                        right: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        zIndex: 1100,
                        pointerEvents: 'none',
                    }}
                >
                    <div
                        style={{
                            fontSize: 16,
                            fontWeight: 500,
                            color: isAgentText ? '#ffe01b' : '#ffffff',
                            lineHeight: 1.6,
                            textShadow: '0 2px 8px rgba(0, 0, 0, 0.8), 0 0 2px rgba(0, 0, 0, 0.9)',
                            padding: '8px 16px',
                            maxWidth: '80%',
                            textAlign: 'center',
                        }}
                    >
                        {displayText}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
