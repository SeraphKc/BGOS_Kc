import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useMessageQueue, type QueuedMessage } from '@bgos/shared-logic';
import { ChatHistoryActions } from '@bgos/shared-state';
import { useWebhook } from './useWebhoock';
import { ChatHistory } from '../types/model/ChatHistory';
import { SendMessageParams } from '../types/n8n/SendMessageParams';

/**
 * Desktop-specific message queue hook
 *
 * Wraps the shared useMessageQueue hook and provides desktop-specific
 * send implementation using Electron IPC via useWebhook.
 *
 * Features:
 * - Sequential message processing (one at a time)
 * - Status updates (queued → sending → sent/failed)
 * - Non-blocking UI (user can type while messages send)
 * - Electron IPC integration
 *
 * @param currentChatId - The current active chat ID
 * @param webhookUrl - The assistant's webhook URL
 * @param userId - The current user ID
 * @param updateChatHistory - Callback to update parent component state
 * @returns Queue management functions and state
 */
export function useChatQueue(
  currentChatId: string,
  webhookUrl: string,
  userId: string,
  updateChatHistory?: (message: ChatHistory, isNewChat?: boolean) => void
) {
  const dispatch = useDispatch();
  const { sendMessage: webhookSend } = useWebhook(webhookUrl, userId);

  /**
   * Platform-specific send implementation for desktop
   * Sends message via Electron IPC and updates Redux with assistant response
   */
  const sendMessageImpl = useCallback(async (queuedMsg: QueuedMessage) => {
    console.log('🖥️  useChatQueue - Sending message via Electron IPC:', {
      id: queuedMsg.id,
      chatId: queuedMsg.chatId || queuedMsg.overrideChatId,
    });

    // Build user message for webhook
    const userMessage: ChatHistory = {
      chatId: queuedMsg.overrideChatId || queuedMsg.chatId || currentChatId,
      sender: 'user',
      text: queuedMsg.text || '',
      sentDate: new Date().toISOString(),
      hasAttachment: !!(queuedMsg.files && queuedMsg.files.length > 0),
      files: queuedMsg.files,
      isAudio: !!queuedMsg.voiceData,
      audioData: queuedMsg.voiceData?.audioData,
      audioFileName: queuedMsg.voiceData?.audioFileName,
      audioMimeType: queuedMsg.voiceData?.audioMimeType,
      duration: queuedMsg.voiceData?.duration,
      isMixedAttachments: false,
    };

    // Send via Electron IPC (useWebhook handles the IPC call)
    const params: SendMessageParams = {
      message: userMessage,
      assistantUrl: webhookUrl,
    };

    const response = await webhookSend(params);

    console.log('🖥️  useChatQueue - Received assistant response:', {
      id: response.id,
      text: response.text.substring(0, 100),
    });

    // Add assistant response to Redux
    dispatch(ChatHistoryActions.addMessage(response));

    // Update parent component state if callback provided
    if (updateChatHistory) {
      updateChatHistory(response);
    }
  }, [currentChatId, webhookUrl, webhookSend, updateChatHistory, dispatch]);

  /**
   * Use shared message queue hook for queue management
   * The hook handles FIFO processing, status updates, and error handling
   */
  const { enqueueMessage, isProcessing, queueLength } = useMessageQueue({
    onSendMessage: sendMessageImpl,
    dispatch,
  });

  /**
   * Send a message (adds to queue for processing)
   *
   * @param text - Message text
   * @param files - Optional file attachments
   * @param voiceData - Optional voice message data
   * @param overrideChatId - Optional chat ID override (for new chats)
   */
  const sendMessage = useCallback((
    text: string,
    files?: any[],
    voiceData?: any,
    overrideChatId?: string
  ) => {
    const messageId = `temp-${Date.now()}`;
    const chatId = overrideChatId || currentChatId;

    console.log('🖥️  useChatQueue - Enqueueing message:', {
      id: messageId,
      chatId,
      queueLength,
      isProcessing,
    });

    // Add to Redux immediately with appropriate status
    dispatch(ChatHistoryActions.addMessage({
      id: messageId,
      chatId,
      sender: 'user',
      text: text || (files && files.length > 0 ? `[${files.length} file(s) attached]` : ''),
      sentDate: new Date().toISOString(),
      hasAttachment: !!(files && files.length > 0),
      files: files || [],
      isAudio: !!voiceData,
      audioData: voiceData?.audioData,
      audioFileName: voiceData?.audioFileName,
      audioMimeType: voiceData?.audioMimeType,
      duration: voiceData?.duration,
      status: isProcessing || queueLength > 0 ? 'queued' : 'sending',
      isMixedAttachments: false,
    }));

    // Enqueue for processing (shared queue hook handles the rest)
    enqueueMessage({
      id: messageId,
      chatId,
      text,
      files,
      voiceData,
      overrideChatId,
    });
  }, [currentChatId, isProcessing, queueLength, enqueueMessage, dispatch]);

  return {
    /**
     * Send a message (adds to queue)
     */
    sendMessage,

    /**
     * Whether a message is currently being processed
     */
    isProcessing,

    /**
     * Number of messages waiting in the queue
     */
    queueLength,
  };
}
