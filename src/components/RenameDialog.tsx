import React, { useState, useEffect, useRef } from 'react';
import { renameChat } from '../services/ChatCRUDService';
import { useNotification } from '../hooks/useNotification';

interface RenameDialogProps {
    isOpen: boolean;
    currentTitle: string;
    chatId: string;
    userId: string;
    onSave: (newTitle: string) => void;
    onCancel: () => void;
}

const RenameDialog: React.FC<RenameDialogProps> = ({
    isOpen,
    currentTitle,
    chatId,
    userId,
    onSave,
    onCancel
}) => {
    const { showNotification } = useNotification();
    const [newTitle, setNewTitle] = useState(currentTitle);
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setNewTitle(currentTitle);
            // Focus input after a short delay to ensure it's rendered
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 100);
        }
    }, [isOpen, currentTitle]);

    const handleSave = async () => {
        if (newTitle.trim()) {
            let operationSuccess: boolean = false;
            setIsSaving(true);
            try {
                const success = await renameChat(userId, chatId, newTitle.trim());
                if (success) {
                    onSave(newTitle.trim());
                    operationSuccess = true;
                } else {
                    console.error('Failed to rename chat');
                    operationSuccess = false;
                }
            } catch (error) {
                console.error('Error renaming chat:', error);
                operationSuccess = false;
            } finally {
                setIsSaving(false);
            }

            if (operationSuccess) {
                showNotification({
                    type: 'success',
                    title: 'Chat renamed',
                    message: `Chat has been renamed to "${newTitle.trim()}".`,
                    autoClose: true,
                    duration: 3000
                });
            } else {
                showNotification({
                    type: 'error',
                    title: 'Failed to rename chat',
                    message: 'Failed to rename chat. Please try again.',
                    autoClose: true,
                    duration: 3000
                });
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50"
                onClick={onCancel}
            />
            
            {/* Dialog */}
            <div 
                className="relative max-w-md w-full mx-4 rounded-lg border shadow-lg"
                style={{
                    backgroundColor: '#262624',
                    borderColor: '#3c3c3a',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}
            >
                <div className="p-6">
                    {/* Title */}
                    <h3 className="text-lg font-semibold mb-4 text-white">
                        Rename chat
                    </h3>
                    
                    {/* Input */}
                    <input
                        ref={inputRef}
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                            backgroundColor: '#3c3c3a',
                            color: '#ffffff',
                            border: '1px solid #3c3c3a'
                        }}
                        placeholder="Enter new chat title..."
                        disabled={isSaving}
                    />
                    
                    {/* Buttons */}
                    <div className="flex gap-3 justify-end mt-6">
                        <button
                            onClick={onCancel}
                            disabled={isSaving}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: '#3c3c3a',
                                color: '#ffffff',
                                border: '1px solid #3c3c3a'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!newTitle.trim() || isSaving}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: '#FFD900',
                                color: '#262624',
                                border: '1px solid transparent'
                            }}
                        >
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RenameDialog; 