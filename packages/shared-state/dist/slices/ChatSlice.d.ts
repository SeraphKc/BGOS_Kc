import { Chat } from '@bgos/shared-types';
export interface ChatState {
    list: Chat[];
    selectedChatId: string | null;
    loading: boolean;
    error: string | null;
}
export declare const setChats: import("@reduxjs/toolkit").ActionCreatorWithPayload<Chat[], "chats/setChats">, setSelectedChat: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "chats/setSelectedChat">, pushChat: import("@reduxjs/toolkit").ActionCreatorWithPayload<Chat, "chats/pushChat">, updateChat: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    id: string;
    updates: Partial<Chat>;
}, "chats/updateChat">, removeChat: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "chats/removeChat">, updateChatUnread: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    id: string;
    unread: number;
}, "chats/updateChatUnread">, setLoading: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean, "chats/setLoading">, setError: import("@reduxjs/toolkit").ActionCreatorWithPayload<string | null, "chats/setError">, clearError: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"chats/clearError">, updateChatTitle: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    chatId: string;
    title: string;
}, "chats/updateChatTitle">, toggleStarChat: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "chats/toggleStarChat">, updateChatStarOrder: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    id: string;
    starOrder: number;
}, "chats/updateChatStarOrder">;
declare const _default: import("redux").Reducer<ChatState>;
export default _default;
