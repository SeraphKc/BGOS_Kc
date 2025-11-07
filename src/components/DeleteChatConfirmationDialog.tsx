import React, { useState } from 'react';
import { deleteChat } from '../services/ChatCRUDService';
import { useNotification } from '../hooks/useNotification';

interface DeleteChatConfirmationDialogProps {
    isOpen: boolean;
    chatId: string;
    userId: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const DeleteChatConfirmationDialog: React.FC<DeleteChatConfirmationDialogProps> = ({
    isOpen,
    chatId,
    userId,
    onConfirm,
    onCancel
}) => {
    const { showNotification } = useNotification();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirm = async () => {
        setIsDeleting(true);
        let operationSuccess: boolean = false;
        try {
            const success = await deleteChat(userId, chatId);
            if (success) {
                onConfirm();
                operationSuccess = true;
            } else {
                console.error('Failed to delete chat');
                operationSuccess = false;
            }
        } catch (error) {
            console.error('Error deleting chat:', error);
            operationSuccess = false;
        } finally {
            setIsDeleting(false);
        }

        if (operationSuccess) {
            showNotification({
                type: 'success',
                title: 'Chat deleted',
                message: 'Chat has been successfully deleted.',
                autoClose: true,
                duration: 3000
            });
        } else {
            showNotification({
                type: 'error',
                title: 'Failed to delete chat',
                message: 'Failed to delete chat. Please try again.',
                autoClose: true,
                duration: 3000
            });
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
                        Delete chat?
                    </h3>
                    
                    {/* Message */}
                    <p className="text-gray-300 mb-6">
                        Are you sure you want to delete this chat?
                    </p>
                    
                    {/* Buttons */}
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onCancel}
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
                            onClick={handleConfirm}
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
                </div>
            </div>
        </div>
    );
};

export default DeleteChatConfirmationDialog; 