import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'unread-messages';

export interface NotificationProps {
    type: NotificationType;
    title: string;
    message: string;
    isVisible: boolean;
    onClose?: () => void;
    onClick?: () => void;
    autoClose?: boolean;
    duration?: number;
}

const Notification: React.FC<NotificationProps> = ({
    type,
    title,
    message,
    isVisible,
    onClose,
    onClick,
    autoClose = true,
    duration = 5000
}) => {
    React.useEffect(() => {
        if (autoClose && isVisible && onClose) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, autoClose, duration, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                );
            case 'error':
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                );
            case 'warning':
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                );
            case 'info':
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'unread-messages':
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    const getColors = () => {
        switch (type) {
            case 'success':
                return {
                    iconBg: 'bg-lime-500',
                    borderColor: 'bg-lime-500',
                    iconColor: 'text-white'
                };
            case 'error':
                return {
                    iconBg: 'bg-red-500',
                    borderColor: 'bg-red-500',
                    iconColor: 'text-white'
                };
            case 'warning':
                return {
                    iconBg: 'bg-yellow-500',
                    borderColor: 'bg-yellow-500',
                    iconColor: 'text-white'
                };
            case 'info':
                return {
                    iconBg: 'bg-blue-500',
                    borderColor: 'bg-blue-500',
                    iconColor: 'text-white'
                };
            case 'unread-messages':
                return {
                    iconBg: 'bg-yellow-500',
                    borderColor: 'bg-yellow-500',
                    iconColor: 'text-white'
                };
            default:
                return {
                    iconBg: 'bg-gray-500',
                    borderColor: 'bg-gray-500',
                    iconColor: 'text-white'
                };
        }
    };

    const colors = getColors();

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    className={`min-w-80 max-w-96 ${onClick ? 'cursor-pointer' : ''}`}
                    onClick={onClick}
                >
                    <div className={`${type === 'unread-messages' ? 'bg-[#141512]' : 'bg-gray-800'} rounded-lg shadow-lg overflow-hidden`}>
                        <div className="px-4 py-3 relative">
                            <div className="flex items-start gap-3">
                                {/* Icon */}
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full ${colors.iconBg} flex items-center justify-center ${colors.iconColor}`}>
                                    {getIcon()}
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-bold text-white mb-1">
                                        {title}
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        {message}
                                    </p>
                                </div>
                                
                                {/* Close button */}
                                {onClose && (
                                    <button
                                        onClick={onClose}
                                        className="flex-shrink-0 ml-2 p-1 bg-transparent border-none text-gray-400 cursor-pointer rounded-full transition-colors duration-200 hover:bg-gray-700 hover:text-white"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        {/* Colored bottom border */}
                        <div className={`h-1 ${colors.borderColor}`} />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Notification; 