import React, { useState, useRef } from 'react';
import { Chat } from '../types/model/Chat';
import { useNotification } from '../hooks/useNotification';
import ContextMenuPortal from './ContextMenuPortal';
import StarIcon from './StarIcon';
import StarFilledIcon from './StarFilledIcon';
import FloatingCheckmark from './FloatingCheckmark';

interface ChatItemMenuProps {
    chat: Chat;
    isSelected: boolean;
    onRename: (chatId: string) => void;
    onDelete: (chatId: string) => void;
    onAssignForAI: (chatId: string) => void;
    onStar?: (chatId: string) => void;
}

const ChatItemMenu: React.FC<ChatItemMenuProps> = ({
    chat,
    isSelected,
    onRename,
    onDelete,
    onAssignForAI,
    onStar
}) => {
    const { showNotification } = useNotification();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showCopyCheck, setShowCopyCheck] = useState(false);
    const [checkPosition, setCheckPosition] = useState({ x: 0, y: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);

    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(!isMenuOpen);
    };

    const handleRename = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        onRename(chat.id);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        onDelete(chat.id);
    };

    const handleAssignForAI = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        onAssignForAI(chat.id);
    };

    const handleCopyChatId = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setCheckPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });

        try {
            await navigator.clipboard.writeText(chat.id);
            setShowCopyCheck(true);
        } catch (error) {
            console.error('Failed to copy chat ID:', error);
            showNotification({
                type: 'error',
                title: 'Copy failed',
                message: 'Failed to copy chat ID. Please try again.',
                autoClose: true,
                duration: 3000
            });
        }
        setIsMenuOpen(false);
    };

    const handleStar = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        if (onStar) {
            onStar(chat.id);
        }
    };

    return (
        <div className="relative">
            {/* Floating checkmark for copy success */}
            {showCopyCheck && (
                <FloatingCheckmark
                    position={checkPosition}
                    onComplete={() => setShowCopyCheck(false)}
                />
            )}

            {/* Three-dot menu icon - show when selected, hovered, or menu is open */}
            <button
                ref={buttonRef}
                onClick={handleMenuClick}
                className={`p-1 hover:bg-gray-700/20 rounded transition-colors duration-200 focus:outline-none ${
                    isMenuOpen || isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                style={{
                    visibility: 'visible'
                }}
            >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 8C4 8.82843 3.32843 9.5 2.5 9.5C1.67157 9.5 1 8.82843 1 8C1 7.17157 1.67157 6.5 2.5 6.5C3.32843 6.5 4 7.17157 4 8Z" fill="currentColor"/>
                    <path d="M9.5 8C9.5 8.82843 8.82843 9.5 8 9.5C7.17157 9.5 6.5 8.82843 6.5 8C6.5 7.17157 7.17157 6.5 8 6.5C8.82843 6.5 9.5 7.17157 9.5 8Z" fill="currentColor"/>
                    <path d="M15 8C15 8.82843 14.3284 9.5 13.5 9.5C12.6716 9.5 12 8.82843 12 8C12 7.17157 12.6716 6.5 13.5 6.5C14.3284 6.5 15 7.17157 15 8Z" fill="currentColor"/>
                </svg>
            </button>

            {/* Context menu rendered via portal */}
            <ContextMenuPortal
                isOpen={isMenuOpen}
                triggerRef={buttonRef}
                onClose={() => setIsMenuOpen(false)}
            >
                <div
                    className="rounded-lg border shadow-lg"
                    style={{
                        backgroundColor: 'rgb(48, 48, 46)',
                        borderColor: '#3c3c3a',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                        minWidth: '140px'
                    }}
                >
                    <div className="py-1">
                        {onStar && (
                            <>
                                <button
                                    onClick={handleStar}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-700/20 transition-colors duration-200 focus:outline-none"
                                    style={{
                                        color: '#a7a7a5',
                                        fontSize: '12px',
                                        fontFamily: 'Styrene-B',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    {chat.isStarred ? (
                                        <StarFilledIcon size={14} />
                                    ) : (
                                        <StarIcon size={14} color="#a7a7a5" />
                                    )}
                                    {chat.isStarred ? 'Unstar' : 'Star'}
                                </button>
                                <div className="border-t mx-2" style={{ borderColor: '#3c3c3a' }}></div>
                            </>
                        )}
                        <button
                            onClick={handleRename}
                            className="w-full px-4 py-2 text-left hover:bg-gray-700/20 transition-colors duration-200 focus:outline-none"
                            style={{
                                color: '#a7a7a5',
                                fontSize: '12px',
                                fontFamily: 'Styrene-B'
                            }}
                        >
                            Rename
                        </button>
                        <button
                            onClick={handleAssignForAI}
                            className="w-full px-4 py-2 text-left hover:bg-gray-700/20 transition-colors duration-200 focus:outline-none"
                            style={{
                                color: '#a7a7a5',
                                fontSize: '12px',
                                fontFamily: 'Styrene-B'
                            }}
                        >
                            Add schedule
                        </button>
                        <button
                            onClick={handleCopyChatId}
                            className="w-full px-4 py-2 text-left hover:bg-gray-700/20 transition-colors duration-200 focus:outline-none"
                            style={{
                                color: '#a7a7a5',
                                fontSize: '12px',
                                fontFamily: 'Styrene-B'
                            }}
                        >
                            Copy chatId
                        </button>
                        <button
                            onClick={handleDelete}
                            className="w-full px-4 py-2 text-left hover:bg-gray-700/20 transition-colors duration-200 focus:outline-none"
                            style={{
                                color: '#d66171',
                                fontSize: '12px',
                                fontFamily: 'Styrene-B'
                            }}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </ContextMenuPortal>
        </div>
    );
};

export default ChatItemMenu; 