import { useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import type { CallbackQuery, CallbackResponse, ChatHistory } from '@bgos/shared-types';
import {
    setButtonLoading,
    clearButtonLoading,
    setInlineInputSubmitting,
    closeInlineInput,
} from '@bgos/shared-state/dist/slices/InlineKeyboardSlice';
import { updateMessage } from '../slices/ChatHistorySlice';

interface UseCallbackQueryOptions {
    webhookUrl: string;
    userId: string;
    timeout?: number; // Default 30000ms
    onNotification?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export function useCallbackQuery(options: UseCallbackQueryOptions) {
    const { webhookUrl, userId, timeout = 30000, onNotification } = options;
    const dispatch = useDispatch();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const sendCallbackQuery = useCallback(async (
        callbackQuery: CallbackQuery
    ): Promise<CallbackResponse> => {
        const { messageId, callback_data } = callbackQuery;

        // Set loading state on the specific button
        dispatch(setButtonLoading({
            messageId,
            buttonId: callback_data,
        }));

        // Set timeout for long-running requests
        timeoutRef.current = setTimeout(() => {
            dispatch(clearButtonLoading(messageId));
            onNotification?.(
                'error',
                'Request timed out',
                'The button action took too long to respond.'
            );
        }, timeout);

        try {
            // Build the callback request payload
            const formDataObj: Record<string, any> = {
                chatId: callbackQuery.chatId,
                sender: 'user',
                sentDate: callbackQuery.timestamp,
                text: '',
                isCallback: 'true',
                callback_query: JSON.stringify(callbackQuery),
            };

            console.log('Sending callback query:', formDataObj);

            // Send via Electron IPC
            const response = await window.electronAPI.sendWebhookRequest(
                `${webhookUrl}/${userId}`,
                formDataObj
            );

            // Clear timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            console.log('Callback response received:', response);

            // Parse response
            let callbackResponse: CallbackResponse;

            if (!response || response.error || !response.data) {
                callbackResponse = {
                    success: false,
                    error: response?.error || 'Empty response from server',
                };
            } else {
                try {
                    callbackResponse = JSON.parse(response.data);
                } catch (parseError) {
                    callbackResponse = {
                        success: false,
                        error: 'Failed to parse callback response',
                    };
                }
            }

            // Clear loading state
            dispatch(clearButtonLoading(messageId));

            // Close inline input if open
            dispatch(closeInlineInput());

            // Handle response
            if (callbackResponse.success) {
                // Show alert/notification if requested
                if (callbackResponse.show_alert && callbackResponse.alert_text) {
                    onNotification?.(
                        'info',
                        'Notice',
                        callbackResponse.alert_text
                    );
                }

                // Update message if new text/markup provided
                if (callbackResponse.new_text !== undefined ||
                    callbackResponse.new_reply_markup !== undefined) {

                    const updates: Partial<ChatHistory> = {};

                    if (callbackResponse.new_text !== undefined) {
                        updates.text = callbackResponse.new_text;
                    }

                    if (callbackResponse.new_reply_markup !== undefined) {
                        updates.reply_markup = callbackResponse.new_reply_markup || undefined;
                    }

                    dispatch(updateMessage({
                        id: messageId,
                        updates,
                    }));
                }
            } else {
                onNotification?.(
                    'error',
                    'Error',
                    callbackResponse.error || 'Failed to process action'
                );
            }

            return callbackResponse;

        } catch (error) {
            // Clear timeout and loading state
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            dispatch(clearButtonLoading(messageId));

            const errorMessage = error instanceof Error
                ? error.message
                : 'Unknown error';

            onNotification?.(
                'error',
                'Error',
                `Failed to process button: ${errorMessage}`
            );

            return { success: false, error: errorMessage };
        }
    }, [webhookUrl, userId, timeout, dispatch, onNotification]);

    return { sendCallbackQuery };
}

export default useCallbackQuery;
