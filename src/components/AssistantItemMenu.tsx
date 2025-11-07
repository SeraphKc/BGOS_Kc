import React, { useState, useRef } from 'react';
import { Assistant } from '../types/model/Assistant';
import ContextMenuPortal from './ContextMenuPortal';
import StarIcon from './StarIcon';
import StarFilledIcon from './StarFilledIcon';

interface AssistantItemMenuProps {
    assistant: Assistant;
    isSelected: boolean;
    isHovered: boolean;
    onNewChat: (assistantId: string) => void;
    onStar: (assistantId: string) => void;
    onEdit: (assistantId: string) => void;
    onDelete: (assistantId: string) => void;
}

const AssistantItemMenu: React.FC<AssistantItemMenuProps> = ({
    assistant,
    isSelected,
    isHovered,
    onNewChat,
    onStar,
    onEdit,
    onDelete
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(!isMenuOpen);
    };

    const handleNewChat = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        onNewChat(assistant.id);
    };

    const handleStar = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        onStar(assistant.id);
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        onEdit(assistant.id);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        onDelete(assistant.id);
    };

    return (
        <div className="relative">
            {/* Three-dot menu icon - show when selected, hovered, or menu is open */}
            <button
                ref={buttonRef}
                onClick={handleMenuClick}
                className="p-1 hover:bg-gray-700/20 rounded transition-colors duration-200 focus:outline-none"
                style={{
                    opacity: isMenuOpen || isSelected || isHovered ? 1 : 0,
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
                        <button
                            onClick={handleNewChat}
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
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 11.5C21 16.75 16.75 21 11.5 21C10.39 21 9.31 20.83 8.29 20.51L3 22L4.49 16.71C4.17 15.69 4 14.61 4 13.5C4 8.25 8.25 4 13.5 4C18.75 4 21 8.25 21 11.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <circle cx="17" cy="17" r="4.5" fill="rgb(48, 48, 46)" stroke="currentColor" strokeWidth="1.5"/>
                                <path d="M17 15V19M15 17H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            New Chat
                        </button>
                        <div className="border-t mx-2" style={{ borderColor: '#3c3c3a' }}></div>
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
                            {assistant.isStarred ? (
                                <StarFilledIcon size={14} />
                            ) : (
                                <StarIcon size={14} color="#a7a7a5" />
                            )}
                            {assistant.isStarred ? 'Unstar' : 'Star'}
                        </button>
                        <div className="border-t mx-2" style={{ borderColor: '#3c3c3a' }}></div>
                        <button
                            onClick={handleEdit}
                            className="w-full px-4 py-2 text-left hover:bg-gray-700/20 transition-colors duration-200 focus:outline-none"
                            style={{
                                color: '#a7a7a5',
                                fontSize: '12px',
                                fontFamily: 'Styrene-B'
                            }}
                        >
                            Edit
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

export default AssistantItemMenu; 