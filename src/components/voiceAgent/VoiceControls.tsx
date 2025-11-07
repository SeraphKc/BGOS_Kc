import React from 'react';
import { motion } from 'framer-motion';
import voiceBtn from '../../assets/images/s2s  voice button.png';
import cancelBtn from '../../assets/images/s2s cancel button.png';

interface VoiceControlsProps {
    isPaused: boolean;
    onPause: () => void;
    onResume: () => void;
    onStop: () => void;
    className?: string;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
    isPaused,
    onPause,
    onResume,
    onStop,
    className = ''
}) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '32px',
                ...(className && { className })
            }}
        >
            <motion.button
                onClick={isPaused ? onResume : onPause}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                    width: 64,
                    height: 64,
                    background: '#212121',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    borderRadius: '50%'
                }}
                title={isPaused ? 'Resume' : 'Pause'}
            >
                <img 
                    src={voiceBtn} 
                    alt="voice control" 
                    style={{ 
                        width: 64, 
                        height: 64, 
                        display: 'block',
                        filter: isPaused ? 'brightness(0.7)' : 'brightness(1)'
                    }} 
                />
            </motion.button>
            
            <motion.button
                onClick={onStop}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                    width: 64,
                    height: 64,
                    background: '#212121',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    borderRadius: '50%'
                }}
                title="Stop"
            >
                <img 
                    src={cancelBtn} 
                    alt="cancel" 
                    style={{ 
                        width: 64, 
                        height: 64, 
                        display: 'block' 
                    }} 
                />
            </motion.button>
        </motion.div>
    );
};