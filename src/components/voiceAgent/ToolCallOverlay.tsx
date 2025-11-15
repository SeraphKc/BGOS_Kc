import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToolCall } from '@bgos/shared-state/dist/slices/voiceSlice';

interface ToolCallOverlayProps {
    toolCalls: ToolCall[];
}

/**
 * ToolCallOverlay
 * Displays active tool calls as floating cards on the conversation page
 * Auto-removes completed/errored calls after 3 seconds
 */
export const ToolCallOverlay: React.FC<ToolCallOverlayProps> = ({ toolCalls }) => {
    const [visibleCalls, setVisibleCalls] = useState<string[]>([]);

    // Track which tool calls should be visible
    useEffect(() => {
        const newVisible = new Set(visibleCalls);
        const timers: NodeJS.Timeout[] = [];

        toolCalls.forEach((call) => {
            // Add all calls to visible set initially
            if (!newVisible.has(call.tool_call_id)) {
                newVisible.add(call.tool_call_id);
            }

            // Auto-remove completed or errored calls after 3 seconds
            if ((call.status === 'completed' || call.status === 'error') && newVisible.has(call.tool_call_id)) {
                const timer = setTimeout(() => {
                    setVisibleCalls(prev => prev.filter(id => id !== call.tool_call_id));
                }, 3000);
                timers.push(timer);
            }
        });

        setVisibleCalls(Array.from(newVisible));

        return () => {
            timers.forEach(timer => clearTimeout(timer));
        };
    }, [toolCalls]);

    // Filter to only show visible calls
    const displayCalls = toolCalls.filter(call => visibleCalls.includes(call.tool_call_id));

    if (displayCalls.length === 0) return null;

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                zIndex: 1001,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                maxWidth: 280,
                maxHeight: 200,
                overflowY: 'auto',
            }}
        >
            <AnimatePresence>
                {displayCalls.map((toolCall) => (
                    <motion.div
                        key={toolCall.tool_call_id}
                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            background: 'rgba(38, 38, 36, 0.92)',
                            borderRadius: 8,
                            padding: 10,
                            border: `1px solid ${getBorderColor(toolCall.status)}`,
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {toolCall.status === 'pending' && <Spinner />}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontSize: 12,
                                    fontWeight: 500,
                                    color: '#E8E6E3',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {toolCall.tool_name}
                                </div>
                                <div style={{
                                    fontSize: 10,
                                    color: getStatusTextColor(toolCall.status),
                                    marginTop: 2
                                }}>
                                    {getStatusText(toolCall.status)}
                                </div>
                            </div>
                            {toolCall.status === 'completed' && (
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                    <path d="M13.5 4L6 11.5L2.5 8" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            )}
                            {toolCall.status === 'error' && (
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                    <path d="M12 4L4 12M4 4l8 8" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            )}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

/**
 * Helper: Get status text
 */
function getStatusText(status: 'pending' | 'completed' | 'error'): string {
    switch (status) {
        case 'pending':
            return 'Running...';
        case 'completed':
            return 'Completed';
        case 'error':
            return 'Failed';
        default:
            return '';
    }
}

/**
 * Helper: Get status text color (muted theme colors)
 */
function getStatusTextColor(status: 'pending' | 'completed' | 'error'): string {
    switch (status) {
        case 'pending':
            return '#B8B6A7'; // Muted yellow
        case 'completed':
            return '#6B9B6E'; // Muted green
        case 'error':
            return '#B87171'; // Muted red
        default:
            return '#999';
    }
}

/**
 * Spinner
 * Simple loading spinner animation (themed)
 */
const Spinner: React.FC = () => {
    return (
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{
                width: 12,
                height: 12,
                border: '2px solid rgba(184, 182, 167, 0.2)',
                borderTop: '2px solid #B8B6A7',
                borderRadius: '50%',
            }}
        />
    );
};

/**
 * Helper: Get border color (subtle theme colors)
 */
function getBorderColor(status: 'pending' | 'completed' | 'error'): string {
    switch (status) {
        case 'pending':
            return 'rgba(184, 182, 167, 0.3)'; // Muted yellow
        case 'completed':
            return 'rgba(107, 155, 110, 0.3)'; // Muted green
        case 'error':
            return 'rgba(184, 113, 113, 0.3)'; // Muted red
        default:
            return 'rgba(153, 153, 153, 0.2)';
    }
}
