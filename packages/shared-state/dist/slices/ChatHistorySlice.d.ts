import { ChatHistory, MessageStatus } from '@bgos/shared-types';
export interface ChatHistoryState {
    list: ChatHistory[];
    loading: boolean;
    error: string | null;
    lastMessageId: string | null;
}
export declare const setChatHistory: import("@reduxjs/toolkit").ActionCreatorWithPayload<ChatHistory[], "chatHistory/setChatHistory">, addMessage: import("@reduxjs/toolkit").ActionCreatorWithPayload<ChatHistory, "chatHistory/addMessage">, updateMessage: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    id: string;
    updates: Partial<ChatHistory>;
}, "chatHistory/updateMessage">, updateMessageStatus: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    id: string;
    status: MessageStatus;
}, "chatHistory/updateMessageStatus">, removeMessage: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "chatHistory/removeMessage">, clearChatHistory: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"chatHistory/clearChatHistory">, setLoading: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean, "chatHistory/setLoading">, setError: import("@reduxjs/toolkit").ActionCreatorWithPayload<string | null, "chatHistory/setError">, clearError: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"chatHistory/clearError">;
declare const _default: import("redux").Reducer<ChatHistoryState>;
export default _default;
