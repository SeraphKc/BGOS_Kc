import { useState, useCallback, useEffect } from 'react';
import { ChatHistoryActions } from '@bgos/shared-state';
/**
 * Platform-agnostic message queue hook
 *
 * Manages a FIFO queue of messages and processes them sequentially.
 * Provides visual feedback by updating message status in Redux.
 *
 * Features:
 * - Sequential processing (one message at a time)
 * - Status state machine: queued → sending → sent/failed
 * - Automatic queue processing
 * - Non-blocking UI (user can queue multiple messages)
 *
 * @param config - Configuration object with send function and dispatch
 * @returns Queue management functions and state
 *
 * @example
 * ```typescript
 * const { enqueueMessage, isProcessing } = useMessageQueue({
 *   onSendMessage: async (msg) => {
 *     await sendToBackend(msg);
 *   },
 *   dispatch: useDispatch(),
 * });
 *
 * // Add message to queue
 * enqueueMessage({
 *   id: 'msg-123',
 *   chatId: 'chat-456',
 *   text: 'Hello!',
 * });
 * ```
 */
export function useMessageQueue(config) {
    const [queue, setQueue] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    /**
     * Process the next message in the queue (FIFO)
     * Updates message status through the full lifecycle:
     * queued → sending → sent/failed
     */
    const processQueue = useCallback(async () => {
        // Don't process if already processing or queue is empty
        if (isProcessing || queue.length === 0)
            return;
        setIsProcessing(true);
        const currentMessage = queue[0];
        try {
            console.log('📤 useMessageQueue - Processing message:', {
                id: currentMessage.id,
                chatId: currentMessage.chatId,
                text: currentMessage.text.substring(0, 50),
            });
            // Update message status to 'sending' and update timestamp
            // Timestamp update ensures message appears after AI's response (chronological order)
            config.dispatch(ChatHistoryActions.updateMessage({
                id: currentMessage.id,
                updates: {
                    status: 'sending',
                    sentDate: new Date().toISOString(),
                },
            }));
            // Platform-specific send implementation (injected via config)
            await config.onSendMessage(currentMessage);
            // Mark message as successfully sent
            config.dispatch(ChatHistoryActions.updateMessageStatus({
                id: currentMessage.id,
                status: 'sent',
            }));
            console.log('✅ useMessageQueue - Message sent successfully:', currentMessage.id);
            // Remove processed message from queue
            setQueue(prev => prev.slice(1));
        }
        catch (err) {
            console.error('❌ useMessageQueue - Error processing message:', err);
            // Mark message as failed (but still remove from queue)
            config.dispatch(ChatHistoryActions.updateMessageStatus({
                id: currentMessage.id,
                status: 'failed',
            }));
            // Remove from queue even on failure (don't block other messages)
            setQueue(prev => prev.slice(1));
        }
        finally {
            setIsProcessing(false);
        }
    }, [isProcessing, queue, config]);
    /**
     * Automatically process the queue when:
     * - A message is added to the queue
     * - The previous message finishes processing
     *
     * This creates a continuous processing loop that handles
     * messages one at a time in FIFO order.
     */
    useEffect(() => {
        if (!isProcessing && queue.length > 0) {
            console.log('🔄 useMessageQueue - Auto-processing queue, length:', queue.length);
            processQueue();
        }
    }, [queue, isProcessing, processQueue]);
    /**
     * Add a message to the queue for processing
     * The message will be sent as soon as the queue is available
     */
    const enqueueMessage = useCallback((message) => {
        console.log('📝 useMessageQueue - Enqueueing message:', {
            id: message.id,
            chatId: message.chatId,
            queueLength: queue.length,
        });
        setQueue(prev => [...prev, message]);
    }, [queue.length]);
    return {
        /**
         * Add a message to the queue
         */
        enqueueMessage,
        /**
         * Whether a message is currently being processed
         */
        isProcessing,
        /**
         * Number of messages waiting in the queue
         */
        queueLength: queue.length,
    };
}
