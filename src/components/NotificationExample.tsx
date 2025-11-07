import React from 'react';
import { useNotification } from '../hooks/useNotification';

const NotificationExample: React.FC = () => {
    const { showNotification } = useNotification();

    const showSuccessNotification = () => {
        showNotification({
            type: 'success',
            title: 'Successful',
            message: 'Your assistant has successfully created!',
            autoClose: true,
            duration: 5000
        });
    };

    const showErrorNotification = () => {
        showNotification({
            type: 'error',
            title: 'Something went wrong',
            message: 'Something went wrong. Please try again later.',
            autoClose: true,
            duration: 5000
        });
    };

    const showWarningNotification = () => {
        showNotification({
            type: 'warning',
            title: 'Warning',
            message: 'This action may have consequences.',
            autoClose: true,
            duration: 5000
        });
    };

    const showInfoNotification = () => {
        showNotification({
            type: 'info',
            title: 'Information',
            message: 'Here is some useful information.',
            autoClose: true,
            duration: 5000
        });
    };

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Notification Examples</h2>
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={showSuccessNotification}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                    Show Success
                </button>
                <button
                    onClick={showErrorNotification}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Show Error
                </button>
                <button
                    onClick={showWarningNotification}
                    className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                    Show Warning
                </button>
                <button
                    onClick={showInfoNotification}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Show Info
                </button>
            </div>
        </div>
    );
};

export default NotificationExample; 