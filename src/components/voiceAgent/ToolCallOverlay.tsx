import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToolCall } from '@bgos/shared-state/dist/slices/voiceSlice';

interface ToolCallOverlayProps {
    toolCalls: ToolCall[];
}

/**
 * ToolCallOverlay
 * Displays active tool calls as floating cards on the conversation page
 */
export const ToolCallOverlay: React.FC<ToolCallOverlayProps> = ({ toolCalls }) => {
    if (toolCalls.length === 0) return null;

    return (
        <div
            style={{
                position: 'absolute',
                top: 20,
                right: 20,
                zIndex: 1001,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                maxWidth: 350,
                maxHeight: 'calc(100vh - 200px)',
                overflowY: 'auto',
            }}
        >
            <AnimatePresence>
                {toolCalls.map((toolCall) => (
                    <motion.div
                        key={toolCall.tool_call_id}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 50, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            background: 'rgba(33, 33, 33, 0.95)',
                            borderRadius: 12,
                            padding: 16,
                            border: `2px solid ${getStatusColor(toolCall.status)}`,
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                            backdropFilter: 'blur(10px)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#fff' }}>
                                {toolCall.tool_name}
                            </h4>
                            <StatusBadge status={toolCall.status} />
                        </div>

                        {toolCall.tool_input && (
                            <div style={{ marginBottom: 8 }}>
                                <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>Input:</div>
                                <pre
                                    style={{
                                        fontSize: 11,
                                        color: '#fff',
                                        background: 'rgba(0, 0, 0, 0.3)',
                                        padding: 8,
                                        borderRadius: 6,
                                        margin: 0,
                                        maxHeight: 100,
                                        overflowY: 'auto',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    {JSON.stringify(toolCall.tool_input, null, 2)}
                                </pre>
                            </div>
                        )}

                        {toolCall.tool_output && (
                            <div>
                                <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>Output:</div>
                                <pre
                                    style={{
                                        fontSize: 11,
                                        color: '#4ade80',
                                        background: 'rgba(0, 0, 0, 0.3)',
                                        padding: 8,
                                        borderRadius: 6,
                                        margin: 0,
                                        maxHeight: 100,
                                        overflowY: 'auto',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    {JSON.stringify(toolCall.tool_output, null, 2)}
                                </pre>
                            </div>
                        )}

                        {toolCall.error && (
                            <div style={{ marginTop: 8 }}>
                                <div style={{ fontSize: 11, color: '#f87171', fontWeight: 500 }}>
                                    Error: {toolCall.error}
                                </div>
                            </div>
                        )}

                        {toolCall.status === 'pending' && (
                            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Spinner />
                                <span style={{ fontSize: 11, color: '#ffe01b' }}>Executing...</span>
                            </div>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

/**
 * StatusBadge
 * Small badge showing tool call status with color coding
 */
const StatusBadge: React.FC<{ status: 'pending' | 'completed' | 'error' }> = ({ status }) => {
    return (
        <span
            style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase',
                padding: '4px 8px',
                borderRadius: 6,
                background: getStatusBackground(status),
                color: getStatusColor(status),
            }}
        >
            {status}
        </span>
    );
};

/**
 * Spinner
 * Simple loading spinner animation
 */
const Spinner: React.FC = () => {
    return (
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{
                width: 14,
                height: 14,
                border: '2px solid rgba(255, 224, 27, 0.2)',
                borderTop: '2px solid #ffe01b',
                borderRadius: '50%',
            }}
        />
    );
};

/**
 * Helper: Get status color
 */
function getStatusColor(status: 'pending' | 'completed' | 'error'): string {
    switch (status) {
        case 'pending':
            return '#ffe01b'; // Yellow
        case 'completed':
            return '#4ade80'; // Green
        case 'error':
            return '#f87171'; // Red
        default:
            return '#999';
    }
}

/**
 * Helper: Get status background
 */
function getStatusBackground(status: 'pending' | 'completed' | 'error'): string {
    switch (status) {
        case 'pending':
            return 'rgba(255, 224, 27, 0.15)';
        case 'completed':
            return 'rgba(74, 222, 128, 0.15)';
        case 'error':
            return 'rgba(248, 113, 113, 0.15)';
        default:
            return 'rgba(153, 153, 153, 0.15)';
    }
}
