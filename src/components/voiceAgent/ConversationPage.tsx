import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VoiceVisualizer } from './VoiceVisualizer';
import { VoiceControls } from './VoiceControls';

interface ConversationPageProps {
    isActive: boolean;
    isThinking: boolean;
    isPaused: boolean;
    audioStream?: MediaStream;
    onStart: () => Promise<void>;
    onPause: () => Promise<void>;
    onResume: () => Promise<void>;
    onStop: () => Promise<void>;
}

export const ConversationPage: React.FC<ConversationPageProps> = ({
    isActive,
    isThinking,
    isPaused,
    audioStream,
    onStart,
    onPause,
    onResume,
    onStop
}) => {
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
            </div>

            <footer style={{
                padding: '24px',
                background: '#212121',
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
                position: 'absolute',
                bottom: 0,
                left: 0,
                zIndex: 1001
            }}>
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