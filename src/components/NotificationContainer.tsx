import React from 'react';
import { useNotification } from '../hooks/useNotification';
import Notification from './Notification';

const NotificationContainer: React.FC = () => {
    const { notifications, hideNotification } = useNotification();

    return (
        <div className="fixed top-5 right-5 z-50 space-y-3">
            {notifications.map((notification, index) => (
                <div
                    key={notification.id}
                    style={{
                        zIndex: 1000 - index
                    }}
                >
                    <Notification
                        type={notification.type}
                        title={notification.title}
                        message={notification.message}
                        isVisible={notification.isVisible}
                        onClose={() => hideNotification(notification.id)}
                        onClick={notification.onClick}
                        autoClose={notification.autoClose}
                        duration={notification.duration}
                    />
                </div>
            ))}
        </div>
    );
};

export default NotificationContainer; 