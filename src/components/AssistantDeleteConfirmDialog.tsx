import React, { useState } from 'react';
import { Assistant } from '../types/model/Assistant';
import { deleteAssistant } from '../services/AssistantCRUDService';
import { useShake } from '../hooks/useShake';
import DialogSuccessState from './DialogSuccessState';

interface AssistantDeleteConfirmDialogProps {
    userId: string;
    currentAssistant: Assistant;
    onClose: () => void;
    onAssistantDeleted?: (assistantId: string) => void;
}

const AssistantDeleteConfirmDialog: React.FC<AssistantDeleteConfirmDialogProps> = ({
    userId,
    currentAssistant,
    onClose,
    onAssistantDeleted
}) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { isShaking, triggerShake } = useShake();

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        setError(null);

        try {
            await deleteAssistant(userId, currentAssistant.id);
            setShowSuccess(true);
        } catch (err) {
            console.error('Failed to delete assistant:', err);
            setError('Failed to delete assistant. Please try again.');
            triggerShake();
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSuccessComplete = () => {
        setShowSuccess(false);
        onAssistantDeleted?.(currentAssistant.id);
        onClose();
    };

    const handleCancel = () => {
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={!showSuccess ? handleCancel : undefined}
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
                            message="Assistant deleted"
                            onComplete={handleSuccessComplete}
                        />
                    ) : (
                        <>
                            {/* Title */}
                            <h3 className="text-lg font-semibold mb-4 text-white">
                                Delete assistant?
                            </h3>

                            {/* Message */}
                            <p className="text-gray-300 mb-6">
                                Are you sure you want to delete assistant <strong>{currentAssistant.name}</strong>?
                            </p>

                            {/* Error message */}
                            {error && (
                                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                                    <p className="text-sm text-red-400">{error}</p>
                                </div>
                            )}

                            {/* Buttons */}
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={handleCancel}
                                    disabled={isDeleting}
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
                                    onClick={handleConfirmDelete}
                                    disabled={isDeleting}
                                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                        backgroundColor: '#dc2626',
                                        color: '#ffffff',
                                        border: '1px solid #dc2626'
                                    }}
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AssistantDeleteConfirmDialog; 