import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { NotificationType } from '../components/Notification';

export interface NotificationItem {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    isVisible: boolean;
    autoClose?: boolean;
    duration?: number;
    onClick?: () => void;
}

interface NotificationContextType {
    notifications: NotificationItem[];
    showNotification: (notification: Omit<NotificationItem, 'id' | 'isVisible'>) => void;
    hideNotification: (id: string) => void;
    clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const timeoutRefs = useRef<{ [key: string]: NodeJS.Timeout }>({});

    const hideNotification = useCallback((id: string) => {
        setNotifications(prev =>
            prev.map(notification =>
                notification.id === id
                    ? { ...notification, isVisible: false }
                    : notification
            )
        );

        setTimeout(() => {
            setNotifications(prev => prev.filter(notification => notification.id !== id));
            clearTimeout(timeoutRefs.current[id]);
            delete timeoutRefs.current[id];
        }, 300);
    }, []);

    const showNotification = useCallback((notification: Omit<NotificationItem, 'id' | 'isVisible'>) => {
        const id = Date.now().toString();
        const newNotification: NotificationItem = {
            ...notification,
            id,
            isVisible: true,
        };

        setNotifications(prev => [...prev, newNotification]);

        if (notification.autoClose !== false) {
            const duration = notification.duration ?? 5000;
            timeoutRefs.current[id] = setTimeout(() => {
                hideNotification(id);
            }, duration);
        }
    }, [hideNotification]);

    const clearAllNotifications = useCallback(() => {
        setNotifications(prev =>
            prev.map(notification => ({ ...notification, isVisible: false }))
        );

        setTimeout(() => {
            setNotifications([]);
            Object.values(timeoutRefs.current).forEach(clearTimeout);
            timeoutRefs.current = {};
        }, 300);
    }, []);

    useEffect(() => {
        return () => {
            Object.values(timeoutRefs.current).forEach(clearTimeout);
        };
    }, []);

    const value: NotificationContextType = {
        notifications,
        showNotification,
        hideNotification,
        clearAllNotifications,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}; 