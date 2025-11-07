import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { ChatHistoryActions } from '@bgos/shared-state';
import { fetchChatHistory } from '@bgos/shared-services';

export const useChatHistory = (userId: string, chatId: string, token: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch();

  const loadChatHistory = useCallback(async () => {
    if (!userId || !chatId || !token) return;

    try {
      setLoading(true);
      setError(null);

      const history = await fetchChatHistory(userId, chatId, token);
      dispatch(ChatHistoryActions.setChatHistory(history));
    } catch (err) {
      const errorMessage = 'Failed to load chat history';
      setError(errorMessage);
      dispatch(ChatHistoryActions.setError(errorMessage));
      console.error('Error loading chat history:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, chatId, token, dispatch]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const tempMessage = {
      id: `temp-${Date.now()}`,
      chatId,
      sender: 'user' as const,
      text,
      sentDate: new Date().toISOString(),
    };

    dispatch(ChatHistoryActions.addMessage(tempMessage));

    // TODO: Send message to backend
    // const response = await sendMessageToBackend(userId, chatId, text, token);
    // dispatch(ChatHistoryActions.addMessage(response));
  }, [chatId, dispatch]);

  return {
    loadChatHistory,
    sendMessage,
    loading,
    error,
  };
};
