import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { removeChat } from '../slices/ChatSlice';
import { setSidebarCollapsed } from '../slices/UISlice';
import { getRelativeTimeFromChatId } from '../utils/dateFormatter';
import { useNotification } from '../hooks/useNotification';
import BulkDeleteConfirmDialog from './BulkDeleteConfirmDialog';

interface ChatHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectChat: (chatId: string) => void;
    onSelectAssistant: (assistantId: string) => void;
    resetChatState: () => void;
}

const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({ isOpen, onClose, onSelectChat, onSelectAssistant, resetChatState }) => {
    const dispatch = useDispatch();
    const { showNotification } = useNotification();
    const chats = useSelector((state: RootState) => state.chats.list);
    const assistants = useSelector((state: RootState) => state.assistants.list);

    const [searchQuery, setSearchQuery] = useState('');
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(new Set());
    const [isShaking, setIsShaking] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Filter chats based on search query (title and messages)
    const filteredChats = useMemo(() => {
        if (!searchQuery.trim()) return chats;

        const query = searchQuery.toLowerCase();
        return chats.filter(chat => {
            // Search in title
            if (chat.title.toLowerCase().includes(query)) return true;

            // TODO: Search in messages when message data is available
            // For now, only searching titles
            return false;
        });
    }, [chats, searchQuery]);

    const handleSelectAll = () => {
        if (selectedChatIds.size === filteredChats.length) {
            setSelectedChatIds(new Set());
        } else {
            setSelectedChatIds(new Set(filteredChats.map(c => c.id)));
        }
    };

    const handleToggleSelect = (chatId: string) => {
        const newSelection = new Set(selectedChatIds);
        if (newSelection.has(chatId)) {
            newSelection.delete(chatId);
        } else {
            newSelection.add(chatId);
        }
        setSelectedChatIds(newSelection);
    };

    const handleBulkDelete = () => {
        if (selectedChatIds.size === 0) return;
        setShowDeleteDialog(true);
    };

    const handleConfirmDelete = () => {
        setIsDeleting(true);

        try {
            selectedChatIds.forEach(chatId => {
                dispatch(removeChat(chatId));
            });

            showNotification({
                type: 'success',
                title: 'Chats deleted',
                message: `${selectedChatIds.size} chat${selectedChatIds.size > 1 ? 's' : ''} deleted successfully.`,
                autoClose: true,
                duration: 3000
            });

            setSelectedChatIds(new Set());
            setIsSelectMode(false);
        } catch (error) {
            console.error('Error deleting chats:', error);
            showNotification({
                type: 'error',
                title: 'Delete failed',
                message: 'Failed to delete chats. Please try again.',
                autoClose: true,
                duration: 3000
            });
        } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    const handleNewChat = () => {
        // Reset chat state to show a blank new chat window (same as sidebar New Chat button)
        resetChatState();
        dispatch(setSidebarCollapsed(true));
        onClose();
    };

    const getAssistantName = (assistantId: string): string => {
        const assistant = assistants.find(a => a.id === assistantId);
        return assistant?.name || 'Unknown';
    };

    const handleChatClick = (chatId: string, assistantId: string) => {
        if (isSelectMode) {
            handleToggleSelect(chatId);
            return;
        }

        // Navigate to the chat using the callbacks
        onSelectChat(chatId);
        onSelectAssistant(assistantId);
        dispatch(setSidebarCollapsed(true));
        onClose();
    };

    const handleBackdropClick = () => {
        // Don't shake if delete dialog is open
        if (showDeleteDialog) return;

        // Trigger shake animation
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
    };

    // ESC key handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !showDeleteDialog) {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, showDeleteDialog, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
            onClick={handleBackdropClick}
        >
            <div
                className="flex flex-col"
                style={{
                    width: '90%',
                    maxWidth: '900px',
                    height: '90vh',
                    backgroundColor: '#212121',
                    borderRadius: '12px',
                    border: '1px solid #3c3c3a',
                    overflow: 'hidden',
                    animation: isShaking ? 'shake 0.5s' : 'none'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <style>
                    {`
                        @keyframes shake {
                            0%, 100% { transform: translateX(0); }
                            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                            20%, 40%, 60%, 80% { transform: translateX(5px); }
                        }
                    `}
                </style>

                {/* Header with close button only */}
                <div
                    className="flex items-center justify-end px-6 py-3"
                >
                    <button
                        onClick={onClose}
                        className="hover:bg-gray-700/20 rounded p-2 transition-colors duration-200"
                        style={{ color: '#a7a7a5' }}
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                {/* Title and New Chat Button */}
                <div className="flex items-center justify-between px-6 pb-4">
                    <h1
                        style={{
                            fontSize: '32px',
                            fontFamily: 'serif',
                            color: '#e8e8e6',
                            fontWeight: 400,
                            margin: 0
                        }}
                    >
                        Your chat history
                    </h1>
                    <button
                        onClick={handleNewChat}
                        className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 hover:shadow-lg"
                        style={{
                            backgroundColor: '#ffffff',
                            color: '#212121',
                            fontSize: '14px',
                            fontFamily: 'Styrene-B',
                            fontWeight: 500,
                            border: 'none'
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8 3.5V12.5M3.5 8H12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        New chat
                    </button>
                </div>

                {/* Search and controls */}
                <div className="px-6 pb-4">
                    {/* Search bar */}
                    <div className="mb-3">
                        <div
                            className="flex items-center px-4 py-2 rounded-lg"
                            style={{ backgroundColor: '#30302e', border: '1px solid #3c3c3a' }}
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: '#a7a7a5', marginRight: '8px' }}>
                                <path d="M7 13C10.3137 13 13 10.3137 13 7C13 3.68629 10.3137 1 7 1C3.68629 1 1 3.68629 1 7C1 10.3137 3.68629 13 7 13Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M15 15L11.5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <input
                                type="text"
                                placeholder="Search your chats..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent outline-none"
                                style={{
                                    color: '#e8e8e6',
                                    fontSize: '14px',
                                    fontFamily: 'Styrene-B'
                                }}
                            />
                        </div>
                    </div>

                    {/* Controls row */}
                    <div className="flex items-center justify-between">
                        <div style={{ color: '#a7a7a5', fontSize: '14px', fontFamily: 'Styrene-B' }}>
                            {filteredChats.length} {filteredChats.length === 1 ? 'chat' : 'chats'}
                        </div>
                        <div className="flex items-center gap-3">
                            {isSelectMode && selectedChatIds.size > 0 && (
                                <>
                                    <button
                                        onClick={handleSelectAll}
                                        className="px-3 py-1 rounded hover:bg-gray-700/20 transition-colors duration-200"
                                        style={{
                                            color: '#a7a7a5',
                                            fontSize: '13px',
                                            fontFamily: 'Styrene-B'
                                        }}
                                    >
                                        {selectedChatIds.size === filteredChats.length ? 'Deselect all' : 'Select all'}
                                    </button>
                                    <button
                                        onClick={handleBulkDelete}
                                        className="px-3 py-1 rounded hover:bg-red-600/20 transition-colors duration-200"
                                        style={{
                                            color: '#d66171',
                                            fontSize: '13px',
                                            fontFamily: 'Styrene-B'
                                        }}
                                    >
                                        Delete ({selectedChatIds.size})
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => {
                                    setIsSelectMode(!isSelectMode);
                                    if (isSelectMode) setSelectedChatIds(new Set());
                                }}
                                className="px-3 py-1 rounded hover:bg-gray-700/20 transition-colors duration-200"
                                style={{
                                    color: isSelectMode ? '#FFD900' : '#a7a7a5',
                                    fontSize: '13px',
                                    fontFamily: 'Styrene-B'
                                }}
                            >
                                {isSelectMode ? 'Cancel' : 'Select'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Chat list */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {filteredChats.length === 0 ? (
                        <div
                            className="flex items-center justify-center h-full"
                            style={{ color: '#a7a7a5', fontSize: '14px', fontFamily: 'Styrene-B' }}
                        >
                            {searchQuery ? 'No chats found' : 'No chats yet'}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {filteredChats.map((chat) => (
                                <div
                                    key={chat.id}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200"
                                    onClick={() => handleChatClick(chat.id, chat.assistantId)}
                                    style={{
                                        backgroundColor: selectedChatIds.has(chat.id)
                                            ? '#3d4f5c'
                                            : '#2a2a28',
                                        border: selectedChatIds.has(chat.id)
                                            ? '1px solid #5a9fd4'
                                            : '1px solid #3c3c3a',
                                        ':hover': {
                                            backgroundColor: isSelectMode ? undefined : '#323230'
                                        }
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isSelectMode && !selectedChatIds.has(chat.id)) {
                                            e.currentTarget.style.backgroundColor = '#323230';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!selectedChatIds.has(chat.id)) {
                                            e.currentTarget.style.backgroundColor = '#2a2a28';
                                        }
                                    }}
                                >
                                    {isSelectMode && (
                                        <input
                                            type="checkbox"
                                            checked={selectedChatIds.has(chat.id)}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                handleToggleSelect(chat.id);
                                            }}
                                            className="w-4 h-4 cursor-pointer"
                                            style={{ accentColor: '#5a9fd4' }}
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div
                                            className="truncate"
                                            style={{
                                                color: '#e8e8e6',
                                                fontSize: '15px',
                                                fontFamily: 'Styrene-B',
                                                marginBottom: '4px',
                                                fontWeight: 500
                                            }}
                                        >
                                            {chat.title}
                                        </div>
                                        <div
                                            style={{
                                                color: '#9a9a98',
                                                fontSize: '13px',
                                                fontFamily: 'Styrene-B'
                                            }}
                                        >
                                            Last message {getRelativeTimeFromChatId(chat.id)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Bulk Delete Confirmation Dialog */}
            <BulkDeleteConfirmDialog
                isOpen={showDeleteDialog}
                chatCount={selectedChatIds.size}
                onConfirm={handleConfirmDelete}
                onCancel={() => setShowDeleteDialog(false)}
                isDeleting={isDeleting}
            />
        </div>
    );
};

export default ChatHistoryModal;
