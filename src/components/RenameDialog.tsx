import React, { useState, useEffect, useRef } from 'react';
import { renameChat } from '../services/ChatCRUDService';
import { useShake } from '../hooks/useShake';
import DialogSuccessState from './DialogSuccessState';

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
    const [newTitle, setNewTitle] = useState(currentTitle);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedTitle, setSavedTitle] = useState('');
    const { isShaking, triggerShake } = useShake();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setNewTitle(currentTitle);
            setError(null);
            setShowSuccess(false);
            // Focus input after a short delay to ensure it's rendered
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 100);
        }
    }, [isOpen, currentTitle]);

    const handleSave = async () => {
        if (!newTitle.trim()) return;

        setIsSaving(true);
        setError(null);

        try {
            const success = await renameChat(userId, chatId, newTitle.trim());
            if (success) {
                setSavedTitle(newTitle.trim());
                setShowSuccess(true);
            } else {
                console.error('Failed to rename chat');
                setError('Failed to rename chat. Please try again.');
                triggerShake();
            }
        } catch (err) {
            console.error('Error renaming chat:', err);
            setError('Failed to rename chat. Please try again.');
            triggerShake();
        } finally {
            setIsSaving(false);
        }
    };

    const handleSuccessComplete = () => {
        setShowSuccess(false);
        onSave(savedTitle);
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
                onClick={!showSuccess ? onCancel : undefined}
            />

            {/* Dialog */}
            <div
                className={`relative max-w-md w-full mx-4 rounded-lg border shadow-lg ${isShaking ? 'shake' : ''}`}
                style={{
                    backgroundColor: '#262624',
                    borderColor: '#3c3c3a',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}
            >
                <div className="p-6">
                    {showSuccess ? (
                        <DialogSuccessState
                            message="Chat renamed"
                            onComplete={handleSuccessComplete}
                        />
                    ) : (
                        <>
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
                                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                style={{
                                    backgroundColor: '#3c3c3a',
                                    color: '#ffffff',
                                    border: '1px solid #3c3c3a'
                                }}
                                placeholder="Enter new chat title..."
                                disabled={isSaving}
                            />

                            {/* Error message */}
                            {error && (
                                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                                    <p className="text-sm text-red-400">{error}</p>
                                </div>
                            )}

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
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RenameDialog; 