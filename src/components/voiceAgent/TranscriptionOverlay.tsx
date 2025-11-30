import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TranscriptionOverlayProps {
    userText: string;
    agentText: string;
    /** Words per minute for pacing (default: 180, typical speech is 120-180 WPM) */
    wordsPerMinute?: number;
}

/**
 * TranscriptionOverlay
 * Minimalistic caption-style transcription display with word-by-word reveal
 * Syncs text display with approximate speaking pace
 */
export const TranscriptionOverlay: React.FC<TranscriptionOverlayProps> = ({
    userText,
    agentText,
    wordsPerMinute = 180
}) => {
    const [displayText, setDisplayText] = useState<string>('');
    const [revealedText, setRevealedText] = useState<string>('');
    const [isVisible, setIsVisible] = useState(false);
    const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);

    const revealIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const wordsQueueRef = useRef<string[]>([]);
    const currentWordIndexRef = useRef<number>(0);
    const lastAgentTextRef = useRef<string>('');

    // Calculate delay per word based on WPM
    const msPerWord = Math.floor(60000 / wordsPerMinute);

    // Clear all timers
    const clearTimers = useCallback(() => {
        if (revealIntervalRef.current) {
            clearInterval(revealIntervalRef.current);
            revealIntervalRef.current = null;
        }
        if (fadeTimeoutRef.current) {
            clearTimeout(fadeTimeoutRef.current);
            fadeTimeoutRef.current = null;
        }
    }, []);

    // Reveal words one by one for agent text
    const startWordReveal = useCallback((text: string) => {
        clearTimers();

        const words = text.split(/\s+/).filter(w => w.length > 0);
        wordsQueueRef.current = words;
        currentWordIndexRef.current = 0;
        setRevealedText('');
        setIsVisible(true);
        setIsAgentSpeaking(true);

        if (words.length === 0) return;

        // Reveal first word immediately
        setRevealedText(words[0]);
        currentWordIndexRef.current = 1;

        // Continue revealing remaining words
        if (words.length > 1) {
            revealIntervalRef.current = setInterval(() => {
                if (currentWordIndexRef.current < wordsQueueRef.current.length) {
                    setRevealedText(prev => {
                        const nextWord = wordsQueueRef.current[currentWordIndexRef.current];
                        currentWordIndexRef.current++;
                        return prev + ' ' + nextWord;
                    });
                } else {
                    // All words revealed, schedule fade-out
                    if (revealIntervalRef.current) {
                        clearInterval(revealIntervalRef.current);
                        revealIntervalRef.current = null;
                    }
                    setIsAgentSpeaking(false);
                    fadeTimeoutRef.current = setTimeout(() => {
                        setIsVisible(false);
                    }, 3000);
                }
            }, msPerWord);
        } else {
            // Single word, just schedule fade-out
            setIsAgentSpeaking(false);
            fadeTimeoutRef.current = setTimeout(() => {
                setIsVisible(false);
            }, 3000);
        }
    }, [msPerWord, clearTimers]);

    // Handle new agent text - append new words if it's a continuation
    useEffect(() => {
        if (agentText && agentText !== lastAgentTextRef.current) {
            const previousText = lastAgentTextRef.current;
            lastAgentTextRef.current = agentText;

            // Check if new text is a continuation of previous
            if (previousText && agentText.startsWith(previousText)) {
                // Append only new words
                const newPortion = agentText.slice(previousText.length).trim();
                if (newPortion) {
                    const newWords = newPortion.split(/\s+/).filter(w => w.length > 0);
                    wordsQueueRef.current = [...wordsQueueRef.current, ...newWords];

                    // Restart interval if it was stopped
                    if (!revealIntervalRef.current && newWords.length > 0) {
                        revealIntervalRef.current = setInterval(() => {
                            if (currentWordIndexRef.current < wordsQueueRef.current.length) {
                                setRevealedText(prev => {
                                    const nextWord = wordsQueueRef.current[currentWordIndexRef.current];
                                    currentWordIndexRef.current++;
                                    return prev + ' ' + nextWord;
                                });
                            } else {
                                if (revealIntervalRef.current) {
                                    clearInterval(revealIntervalRef.current);
                                    revealIntervalRef.current = null;
                                }
                                setIsAgentSpeaking(false);
                                fadeTimeoutRef.current = setTimeout(() => {
                                    setIsVisible(false);
                                }, 3000);
                            }
                        }, msPerWord);
                    }
                }
            } else {
                // New text entirely, start fresh reveal
                startWordReveal(agentText);
            }

            setDisplayText(agentText);
        }
    }, [agentText, msPerWord, startWordReveal]);

    // Handle user text (show immediately, no word reveal needed)
    useEffect(() => {
        if (userText && !agentText) {
            clearTimers();
            lastAgentTextRef.current = '';
            setDisplayText(userText);
            setRevealedText(userText);
            setIsVisible(true);
            setIsAgentSpeaking(false);

            fadeTimeoutRef.current = setTimeout(() => {
                setIsVisible(false);
            }, 5000);
        }
    }, [userText, agentText, clearTimers]);

    // Cleanup on unmount
    useEffect(() => {
        return () => clearTimers();
    }, [clearTimers]);

    // Use revealed text for agent, full text for user
    const textToShow = isAgentSpeaking || agentText ? revealedText : displayText;

    return (
        <AnimatePresence>
            {isVisible && textToShow && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{
                        duration: 0.4,
                        ease: 'easeOut'
                    }}
                    style={{
                        position: 'fixed',
                        bottom: 140,
                        left: 0,
                        right: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        zIndex: 999,
                        pointerEvents: 'none',
                    }}
                >
                    <div
                        style={{
                            fontSize: 16,
                            fontWeight: 500,
                            color: isAgentSpeaking || agentText ? '#ffe01b' : '#ffffff',
                            lineHeight: 1.6,
                            textShadow: '0 2px 8px rgba(0, 0, 0, 0.8), 0 0 2px rgba(0, 0, 0, 0.9)',
                            padding: '8px 16px',
                            maxWidth: '80%',
                            textAlign: 'center',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                        }}
                    >
                        {textToShow}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
