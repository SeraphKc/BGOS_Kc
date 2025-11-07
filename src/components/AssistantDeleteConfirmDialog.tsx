import React, { useState } from 'react';
import { Assistant } from '../types/model/Assistant';
import { deleteAssistant } from '../services/AssistantCRUDService';
import { useNotification } from '../hooks/useNotification';

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
    const { showNotification } = useNotification();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteAssistant(userId, currentAssistant.id);
            showNotification({
                type: 'success',
                title: 'Assistant deleted',
                message: `Assistant "${currentAssistant.name}" has been successfully deleted.`,
                autoClose: true,
                duration: 3000
            });
            onAssistantDeleted?.(currentAssistant.id);
            onClose();
        } catch (error) {
            console.error('Failed to delete assistant:', error);
            showNotification({
                type: 'error',
                title: 'Failed to delete assistant',
                message: 'Failed to delete assistant. Please try again.',
                autoClose: true,
                duration: 3000
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCancel = () => {
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50"
                onClick={handleCancel}
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
                        Delete assistant?
                    </h3>
                    
                    {/* Message */}
                    <p className="text-gray-300 mb-6">
                        Are you sure you want to delete assistant <strong>{currentAssistant.name}</strong>?
                    </p>
                    
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
                </div>
            </div>
        </div>
    );
};

export default AssistantDeleteConfirmDialog; 