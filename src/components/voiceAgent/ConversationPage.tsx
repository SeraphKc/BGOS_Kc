import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { VoiceVisualizer } from './VoiceVisualizer';
import { VoiceControls } from './VoiceControls';
import { ToolCallOverlay } from './ToolCallOverlay';
import { TranscriptionOverlay } from './TranscriptionOverlay';
import { RootState } from '../../config/storeConfig';

interface ConversationPageProps {
    isActive: boolean;
    isThinking: boolean;
    isPaused: boolean;
    audioStream?: MediaStream;
    onStart: () => Promise<void>;
    onPause: () => Promise<void>;
    onResume: () => Promise<void>;
    onStop: () => Promise<void>;
    onSendTextMessage?: (text: string) => void;
}

export const ConversationPage: React.FC<ConversationPageProps> = ({
    isActive,
    isThinking,
    isPaused,
    audioStream,
    onStart,
    onPause,
    onResume,
    onStop,
    onSendTextMessage
}) => {
    // Get voice state from Redux
    const { toolCalls, liveTranscription } = useSelector((state: RootState) => state.voice);

    // Text input state
    const [textInput, setTextInput] = useState('');
    const [isTextInputFocused, setIsTextInputFocused] = useState(false);
    const textInputRef = useRef<HTMLInputElement>(null);

    // Handle text message submission
    const handleSendText = () => {
        if (textInput.trim() && onSendTextMessage) {
            onSendTextMessage(textInput.trim());
            setTextInput('');
        }
    };

    // Handle keyboard shortcuts
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendText();
        }
        if (e.key === 'Escape') {
            setTextInput('');
            textInputRef.current?.blur();
        }
    };

    // Debug logging
    useEffect(() => {
        console.log('[ConversationPage] Tool calls:', toolCalls);
        console.log('[ConversationPage] Live transcription:', liveTranscription);
    }, [toolCalls, liveTranscription]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 1000,
                background: '#212121',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'auto',
            }}
        >


            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                width: '100%',
                maxWidth: '800px',
                maxHeight: '800px',
                margin: '0 auto'
            }}>
                <VoiceVisualizer
                    isActive={isActive}
                    isThinking={isThinking}
                    audioStream={audioStream}
                    style={{
                        width: '100%',
                        height: '100%',
                        maxWidth: '800px',
                        maxHeight: '800px',
                        display: 'block',
                        background: '#212121',
                    }}
                />

                {/* Tool call overlay (top-right floating cards) */}
                <ToolCallOverlay toolCalls={toolCalls} />

                {/* Transcription overlay (bottom subtitle style) */}
                <TranscriptionOverlay
                    userText={liveTranscription.user}
                    agentText={liveTranscription.agent}
                />
            </div>

            <footer style={{
                padding: '24px',
                background: '#212121',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                width: '100%',
                position: 'absolute',
                bottom: 0,
                left: 0,
                zIndex: 1001
            }}>
                {/* Text input for typing messages */}
                {onSendTextMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            width: '100%',
                            maxWidth: '500px',
                            padding: '0 16px'
                        }}
                    >
                        <div
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                background: isTextInputFocused ? '#2a2a28' : '#1a1a18',
                                borderRadius: '24px',
                                border: isTextInputFocused ? '1px solid #FFD700' : '1px solid #3c3c3a',
                                padding: '8px 16px',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <input
                                ref={textInputRef}
                                type="text"
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onFocus={() => setIsTextInputFocused(true)}
                                onBlur={() => setIsTextInputFocused(false)}
                                placeholder="Type a message..."
                                style={{
                                    flex: 1,
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    color: '#e8e8e6',
                                    fontSize: '14px',
                                    fontFamily: 'Styrene-B, sans-serif'
                                }}
                            />
                            {textInput.trim() && (
                                <motion.button
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    onClick={handleSendText}
                                    style={{
                                        background: '#FFD700',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '28px',
                                        height: '28px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        marginLeft: '8px'
                                    }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"
                                            stroke="#212121"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </motion.button>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Voice controls */}
                <VoiceControls
                    isPaused={isPaused}
                    onPause={onPause}
                    onResume={onResume}
                    onStop={onStop}
                />
            </footer>
        </motion.div>
    );
};