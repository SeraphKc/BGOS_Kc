import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { ChatHistoryActions } from '@bgos/shared-state';
import { fetchChatHistory } from '@bgos/shared-services';
import { useMessageQueue, type QueuedMessage } from '@bgos/shared-logic';
import { sendMessageToWebhook } from '../services/webhookService';
import { createChat } from '../services/chatService';
import { Chat, ChatHistory } from '@bgos/shared-types';

export const useChatHistory = (
  userId: string,
  chatId: string,
  token: string,
  assistantWebhookUrl?: string,
  selectedAssistantId?: string
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingChat, setCreatingChat] = useState(false);
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

  /**
   * Creates a new chat on the backend before sending first message
   * Returns the backend-generated chat object with ID and title
   */
  const createNewChat = useCallback(async (firstMessage: string): Promise<Chat | null> => {
    if (!userId || !selectedAssistantId) {
      console.error('Cannot create chat: missing userId or selectedAssistantId', {
        userId,
        selectedAssistantId,
        hasUserId: !!userId,
        hasAssistantId: !!selectedAssistantId,
      });
      return null;
    }

    try {
      setCreatingChat(true);
      setError(null);

      console.log('Creating new chat with first message:', firstMessage.substring(0, 50));

      const newChat = await createChat({
        userId,
        chatFirstMessage: firstMessage,
        assistantId: selectedAssistantId,
        token,
      });

      console.log('Chat created successfully:', newChat.id);

      return newChat;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create chat';
      setError(errorMessage);
      console.error('Error creating chat:', err);

      // Show error message in chat
      const errorText = !userId ? 'User not logged in' :
                       !selectedAssistantId ? 'No assistant selected. Please select an assistant from the dropdown above.' :
                       `Error creating chat: ${errorMessage}`;

      dispatch(ChatHistoryActions.addMessage({
        id: `error-${Date.now()}`,
        chatId: 'new',
        sender: 'assistant' as const,
        text: errorText,
        sentDate: new Date().toISOString(),
        hasAttachment: false,
        isAudio: false,
      }));

      return null;
    } finally {
      setCreatingChat(false);
    }
  }, [userId, selectedAssistantId, token, dispatch]);

  /**
   * Internal function to send a message with an optional override chatId
   * Used when sending the first message after creating a new chat
   * @param skipUserMessage - If true, skips adding user message (already added elsewhere)
   */
  const sendMessageWithChatId = useCallback(async (
    text: string,
    files?: any[],
    voiceData?: any,
    overrideChatId?: string,
    skipUserMessage?: boolean
  ) => {
    // Use override chatId if provided, otherwise use the hook's chatId
    const activeChatId = overrideChatId || chatId;

    // Check if there's any content to send
    if (!text.trim() && (!files || files.length === 0) && !voiceData) return;

    // Check if webhook URL is available
    if (!assistantWebhookUrl) {
      console.error('No assistant webhook URL available');
      dispatch(ChatHistoryActions.addMessage({
        id: `error-${Date.now()}`,
        chatId: activeChatId,
        sender: 'assistant' as const,
        text: 'Error: No assistant configured. Please select an assistant.',
        sentDate: new Date().toISOString(),
        hasAttachment: false,
        isAudio: false,
      }));
      return;
    }

    // Only add user message if not skipped (for new chats, it's already added)
    if (!skipUserMessage) {
      // Build user message object to show immediately
      const tempMessage: any = {
        id: `temp-${Date.now()}`,
        chatId: activeChatId,
        sender: 'user' as const,
        text,
        sentDate: new Date().toISOString(),
        hasAttachment: files && files.length > 0,
        files: files || [],
      };

      // Add voice data if present
      if (voiceData) {
        tempMessage.isAudio = true;
        tempMessage.audioData = voiceData.audioData;
        tempMessage.audioFileName = voiceData.audioFileName;
        tempMessage.audioMimeType = voiceData.audioMimeType;
        tempMessage.audioFilePath = voiceData.audioFilePath; // Preserve file path
        tempMessage.duration = voiceData.duration;
      }

      console.log('🟢 useChatHistory - Adding user message to Redux:', {
        id: tempMessage.id,
        chatId: tempMessage.chatId,
        text: tempMessage.text,
        textLength: tempMessage.text?.length || 0,
        sender: tempMessage.sender,
        fullMessage: JSON.stringify(tempMessage),
      });

      // Show user message immediately
      dispatch(ChatHistoryActions.addMessage(tempMessage));
    }

    try {
      setLoading(true);

      // Send message to N8n webhook
      const response = await sendMessageToWebhook({
        userId,
        assistantWebhookUrl,
        chatId: activeChatId,
        text,
        files,
        audioData: voiceData?.audioData,
        audioFileName: voiceData?.audioFileName,
        audioMimeType: voiceData?.audioMimeType,
        audioFilePath: voiceData?.audioFilePath, // Include file path for binary upload
        duration: voiceData?.duration,
      });

      // Add assistant response to chat
      dispatch(ChatHistoryActions.addMessage(response));
    } catch (err) {
      console.error('Error sending message to webhook:', err);
      dispatch(ChatHistoryActions.addMessage({
        id: `error-${Date.now()}`,
        chatId: activeChatId,
        sender: 'assistant' as const,
        text: `Error: ${err instanceof Error ? err.message : 'Failed to send message'}`,
        sentDate: new Date().toISOString(),
        hasAttachment: false,
        isAudio: false,
      }));
    } finally {
      setLoading(false);
    }
  }, [chatId, userId, assistantWebhookUrl, dispatch]);

  /**
   * Platform-specific send implementation for the message queue
   * This is injected into the shared useMessageQueue hook
   */
  const sendMessageImpl = useCallback(async (queuedMsg: QueuedMessage) => {
    await sendMessageWithChatId(
      queuedMsg.text,
      queuedMsg.files,
      queuedMsg.voiceData,
      queuedMsg.overrideChatId,
      true // Skip adding user message (already added)
    );
  }, [sendMessageWithChatId]);

  /**
   * Use shared message queue hook for queue management
   * The hook handles FIFO processing, status updates, and error handling
   */
  const { enqueueMessage, isProcessing: isProcessingQueue, queueLength } = useMessageQueue({
    onSendMessage: sendMessageImpl,
    dispatch,
  });

  /**
   * New sendMessage function that adds to queue instead of blocking
   */
  const sendMessage = useCallback(async (text: string, files?: any[], voiceData?: any) => {
    // Check if there's any content to send (voice messages have empty text but voiceData)
    if (!text.trim() && (!files || files.length === 0) && !voiceData) return;

    // Check if webhook URL is available
    if (!assistantWebhookUrl) {
      console.error('No assistant webhook URL available');
      dispatch(ChatHistoryActions.addMessage({
        id: `error-${Date.now()}`,
        chatId,
        sender: 'assistant' as const,
        text: 'Error: No assistant configured. Please select an assistant.',
        sentDate: new Date().toISOString(),
        hasAttachment: false,
        isAudio: false,
      }));
      return;
    }

    // Generate unique message ID
    const messageId = `temp-${Date.now()}`;

    // Build user message object to show immediately
    const tempMessage: ChatHistory = {
      id: messageId,
      chatId,
      sender: 'user' as const,
      sentDate: new Date().toISOString(),
      hasAttachment: files && files.length > 0,
      files: files || [],
      status: loading || isProcessingQueue ? 'queued' : 'sending',
    };

    // Add text only if it's not empty
    if (text && text.trim().length > 0) {
      tempMessage.text = text;
    }

    // Add voice data if present
    if (voiceData) {
      tempMessage.isAudio = true;
      tempMessage.audioData = voiceData.audioData;
      tempMessage.audioFileName = voiceData.audioFileName;
      tempMessage.audioMimeType = voiceData.audioMimeType;
      tempMessage.audioFilePath = voiceData.audioFilePath;
      tempMessage.duration = voiceData.duration;
    }

    console.log('🟢 useChatHistory - Adding user message to Redux:', {
      id: tempMessage.id,
      chatId: tempMessage.chatId,
      text: tempMessage.text,
      status: tempMessage.status,
    });

    // Show user message immediately
    dispatch(ChatHistoryActions.addMessage(tempMessage));

    // Enqueue message for processing (shared queue hook handles the rest)
    enqueueMessage({
      id: messageId,
      chatId,
      text,
      files,
      voiceData,
    });
  }, [chatId, assistantWebhookUrl, loading, isProcessingQueue, queueLength, enqueueMessage, dispatch]);

  return {
    loadChatHistory,
    sendMessage,
    sendMessageWithChatId,
    createNewChat,
    loading,
    creatingChat,
    error,
    isProcessingQueue,
  };
};
