import { useEffect, useRef, useCallback } from 'react';
import { useAppSelector } from '../utils/hooks';
import { Chat } from '../types/model/Chat';
import { Assistant } from '../types/model/Assistant';

interface UnreadMessagesMap {
  [chatId: string]: number;
}

interface UseUnreadNotificationsProps {
  selectedChatId: string | null;
  onOpenChat: (chatId: string) => void;
}

export const useUnreadNotifications = ({ selectedChatId, onOpenChat }: UseUnreadNotificationsProps) => {
  const chats = useAppSelector((state) => state.chats.list);
  const assistants = useAppSelector((state) => state.assistants.list);
  const previousUnreadState = useRef<UnreadMessagesMap>({});
  const isWindowVisible = useRef<boolean>(true);

  // Check window visibility periodically
  useEffect(() => {
    const checkWindowVisibility = async () => {
      try {
        const isVisible = await window.electronAPI.isWindowVisible();
        isWindowVisible.current = isVisible;
      } catch (error) {
        console.error('Failed to check window visibility:', error);
        isWindowVisible.current = false; // Default to not visible if error
      }
    };

    // Check immediately on mount
    checkWindowVisibility();
    
    const interval = setInterval(checkWindowVisibility, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle notification clicks
  useEffect(() => {
    const handleNotificationClick = (data: { chatId: string }) => {
      onOpenChat(data.chatId);
    };

    window.electronAPI.onOpenChatNotification(handleNotificationClick);

    return () => {
      window.electronAPI.removeOpenChatNotificationListener();
    };
  }, [onOpenChat]);

  const showNotification = useCallback(async (
    chatId: string, 
    unreadCount: number, 
    previousUnreadCount: number
  ) => {
    // Don't show notification if:
    // 1. No unread messages at all
    // 2. No new unread messages AND window is visible
    if (unreadCount === 0 || (unreadCount <= previousUnreadCount && isWindowVisible.current)) {

      return;
    }




    const chat = chats.find(c => c.id === chatId);
    const assistant = assistants.find(a => a.id === chat?.assistantId);

    if (!chat || !assistant) {
      return;
    }

    try {
      
      const result = await window.electronAPI.showUnreadNotification({
        chatId,
        chatTitle: chat.title,
        unreadCount,
        assistantName: assistant.name,
        avatarUrl: assistant.avatarUrl || undefined
      });

    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }, [selectedChatId, chats, assistants]);

  const processUnreadMessages = useCallback((newUnreadMessages: UnreadMessagesMap) => {

    
    Object.entries(newUnreadMessages).forEach(([chatId, unreadCount]) => {
      const previousCount = previousUnreadState.current[chatId] || 0;

      
      // Show notification if:
      // 1. There are new unread messages (count increased)
      // 2. OR window is not visible (app is minimized to tray)
      // 3. OR there are unread messages and this is the first time we see them
      const hasNewMessages = unreadCount > previousCount;
      const isFirstTime = previousCount === 0 && unreadCount > 0;
      const shouldShowForTray = !isWindowVisible.current && unreadCount > 0;
      
      if (hasNewMessages || isFirstTime || shouldShowForTray) {
        showNotification(chatId, unreadCount, previousCount);
      }
    });

    // Update previous state AFTER processing all notifications
    previousUnreadState.current = { ...newUnreadMessages };
  }, [showNotification]);

  // Function to reset previous state (useful for testing)
  const resetPreviousState = useCallback(() => {
    previousUnreadState.current = {};
  }, []);

  return {
    processUnreadMessages,
    resetPreviousState,
    isWindowVisible: isWindowVisible.current
  };
}; 