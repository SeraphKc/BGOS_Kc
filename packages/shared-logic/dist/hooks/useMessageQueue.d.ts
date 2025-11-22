import type { Dispatch } from 'redux';
/**
 * Represents a message waiting in the queue to be sent
 */
export type QueuedMessage = {
    id: string;
    chatId: string;
    text: string;
    files?: any[];
    voiceData?: any;
    overrideChatId?: string;
};
/**
 * Configuration for the message queue hook
 */
export type UseMessageQueueConfig = {
    /**
     * Platform-specific function to send a message
     * This should handle the actual HTTP/IPC call to send the message
     */
    onSendMessage: (message: QueuedMessage) => Promise<void>;
    /**
     * Redux dispatch function for updating message status
     */
    dispatch: Dispatch;
};
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
export declare function useMessageQueue(config: UseMessageQueueConfig): {
    /**
     * Add a message to the queue
     */
    enqueueMessage: (message: QueuedMessage) => void;
    /**
     * Whether a message is currently being processed
     */
    isProcessing: boolean;
    /**
     * Number of messages waiting in the queue
     */
    queueLength: number;
};
