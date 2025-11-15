import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TranscriptionOverlayProps {
    userText: string;
    agentText: string;
}

/**
 * TranscriptionOverlay
 * Displays live transcription at the bottom of the conversation page (subtitle style)
 */
export const TranscriptionOverlay: React.FC<TranscriptionOverlayProps> = ({ userText, agentText }) => {
    const hasContent = userText || agentText;

    return (
        <AnimatePresence>
            {hasContent && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        position: 'absolute',
                        bottom: 100, // Above the voice controls
                        left: 0,
                        right: 0,
                        zIndex: 1001,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '0 40px',
                        pointerEvents: 'none',
                    }}
                >
                    <div
                        style={{
                            background: 'rgba(0, 0, 0, 0.85)',
                            borderRadius: 12,
                            padding: '16px 24px',
                            maxWidth: 800,
                            width: '100%',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                        }}
                    >
                        {userText && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{
                                    marginBottom: agentText ? 12 : 0,
                                }}
                            >
                                <div style={{ fontSize: 11, color: '#999', marginBottom: 4, fontWeight: 600 }}>
                                    YOU
                                </div>
                                <div
                                    style={{
                                        fontSize: 15,
                                        color: '#fff',
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {userText}
                                </div>
                            </motion.div>
                        )}

                        {agentText && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <div style={{ fontSize: 11, color: '#ffe01b', marginBottom: 4, fontWeight: 600 }}>
                                    ASSISTANT
                                </div>
                                <div
                                    style={{
                                        fontSize: 15,
                                        color: '#ffe01b',
                                        lineHeight: 1.5,
                                        fontWeight: 500,
                                    }}
                                >
                                    {agentText}
                                </div>
                            </motion.div>
                        )}

                        {/* Typing indicator when agent is speaking */}
                        {agentText && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                style={{
                                    display: 'flex',
                                    gap: 4,
                                    marginTop: 8,
                                    alignItems: 'center',
                                }}
                            >
                                <TypingDot delay={0} />
                                <TypingDot delay={0.2} />
                                <TypingDot delay={0.4} />
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

/**
 * TypingDot
 * Animated dot for typing indicator
 */
const TypingDot: React.FC<{ delay: number }> = ({ delay }) => {
    return (
        <motion.div
            animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5],
            }}
            transition={{
                duration: 1,
                repeat: Infinity,
                delay,
            }}
            style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#ffe01b',
            }}
        />
    );
};
