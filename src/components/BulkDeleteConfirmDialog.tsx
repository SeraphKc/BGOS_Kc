import React from 'react';
import DialogSuccessState from './DialogSuccessState';

interface BulkDeleteConfirmDialogProps {
    isOpen: boolean;
    chatCount: number;
    onConfirm: () => void;
    onCancel: () => void;
    isDeleting?: boolean;
    showSuccess?: boolean;
    error?: string | null;
    isShaking?: boolean;
}

const BulkDeleteConfirmDialog: React.FC<BulkDeleteConfirmDialogProps> = ({
    isOpen,
    chatCount,
    onConfirm,
    onCancel,
    isDeleting = false,
    showSuccess = false,
    error = null,
    isShaking = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={isDeleting || showSuccess ? undefined : onCancel}
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
                            message={`${chatCount} chat${chatCount > 1 ? 's' : ''} deleted`}
                            onComplete={onCancel}
                        />
                    ) : (
                        <>
                            {/* Title */}
                            <h3
                                className="text-lg font-semibold mb-4 text-white"
                                style={{ fontFamily: 'Styrene-B' }}
                            >
                                Delete {chatCount} {chatCount === 1 ? 'chat' : 'chats'}?
                            </h3>

                            {/* Message */}
                            <p
                                className="text-gray-300 mb-6"
                                style={{ fontFamily: 'Styrene-B', fontSize: '14px' }}
                            >
                                Are you sure you want to delete {chatCount} {chatCount === 1 ? 'chat' : 'chats'}?
                                This action cannot be undone.
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
                                    onClick={onCancel}
                                    disabled={isDeleting}
                                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                        backgroundColor: '#3c3c3a',
                                        color: '#ffffff',
                                        border: '1px solid #3c3c3a',
                                        fontFamily: 'Styrene-B'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={isDeleting}
                                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                        backgroundColor: '#dc2626',
                                        color: '#ffffff',
                                        border: '1px solid #dc2626',
                                        fontFamily: 'Styrene-B'
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

export default BulkDeleteConfirmDialog;
