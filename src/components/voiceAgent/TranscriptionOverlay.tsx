import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TranscriptionOverlayProps {
    userText: string;
    agentText: string;
}

/**
 * TranscriptionOverlay
 * Minimalistic caption-style transcription display
 * Fades in/out automatically, positioned below visualizer
 */
export const TranscriptionOverlay: React.FC<TranscriptionOverlayProps> = ({ userText, agentText }) => {
    const [displayText, setDisplayText] = useState<string>('');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Determine which text to display (prioritize agent text)
        const newText = agentText || userText;

        if (newText && newText !== displayText) {
            setDisplayText(newText);
            setIsVisible(true);

            // Auto fade-out after 3 seconds
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [userText, agentText]);

    return (
        <AnimatePresence>
            {isVisible && displayText && (
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
                        bottom: 140, // Below visualizer, above controls
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 999,
                        pointerEvents: 'none',
                        maxWidth: '80%',
                        textAlign: 'center',
                    }}
                >
                    <div
                        style={{
                            fontSize: 16,
                            fontWeight: 500,
                            color: agentText ? '#ffe01b' : '#ffffff',
                            lineHeight: 1.6,
                            textShadow: '0 2px 8px rgba(0, 0, 0, 0.8), 0 0 2px rgba(0, 0, 0, 0.9)',
                            padding: '8px 16px',
                            maxWidth: 700,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2, // Limit to 2 lines
                            WebkitBoxOrient: 'vertical',
                        }}
                    >
                        {displayText}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
