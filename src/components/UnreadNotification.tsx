import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface UnreadNotificationProps {
    chatTitle: string;
    assistantName: string;
    unreadCount: number;
    isVisible: boolean;
    onClose?: () => void;
    onClick?: () => void;
    autoClose?: boolean;
    duration?: number;
}

const UnreadNotification: React.FC<UnreadNotificationProps> = ({
    chatTitle,
    assistantName,
    unreadCount,
    isVisible,
    onClose,
    onClick,
    autoClose = true,
    duration = 8000
}) => {
    React.useEffect(() => {
        if (autoClose && isVisible && onClose) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, autoClose, duration, onClose]);

    const handleClick = () => {
        if (onClick) {
            onClick();
        }
        if (onClose) {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    className="min-w-80 max-w-96 cursor-pointer"
                    onClick={handleClick}
                >
                    <div className="bg-blue-600 rounded-lg shadow-lg overflow-hidden border-l-4 border-blue-400">
                        <div className="px-4 py-3 relative">
                            <div className="flex items-start gap-3">
                                {/* Icon */}
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-bold text-white mb-1">
                                        New message from {assistantName}
                                    </h3>
                                    <p className="text-sm text-blue-100 mb-1">
                                        {unreadCount} an unread message
                                    </p>
                                    <p className="text-xs text-blue-200">
                                        в чате "{chatTitle}"
                                    </p>
                                </div>
                                
                                {/* Close button */}
                                {onClose && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onClose();
                                        }}
                                        className="flex-shrink-0 ml-2 p-1 bg-transparent border-none text-blue-200 cursor-pointer rounded-full transition-colors duration-200 hover:bg-blue-500 hover:text-white"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        {/* Colored bottom border */}
                        <div className="h-1 bg-blue-400" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default UnreadNotification; 