import React from 'react';
import { motion } from 'framer-motion';

interface TranscriptLoaderProps {
    isVisible: boolean;
}

export const TranscriptLoader: React.FC<TranscriptLoaderProps> = ({ isVisible }) => {
    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '16px 24px',
                background: 'rgba(255, 224, 27, 0.1)',
                border: '1px solid rgba(255, 224, 27, 0.3)',
                borderRadius: '12px',
                margin: '16px 0',
                maxWidth: '400px',
                marginLeft: 'auto',
                marginRight: 'auto'
            }}
        >
            <div style={{
                width: '32px',
                height: '32px',
                border: '2px solid #ffe01b',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }}>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
            <span style={{
                color: '#ffe01b',
                fontSize: '14px',
                fontWeight: '600'
            }}>
                Loading transcript...
            </span>
        </motion.div>
    );
}; 