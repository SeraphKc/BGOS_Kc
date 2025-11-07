import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Chat } from '@bgos/shared-types';

export interface ChatState {
    list: Chat[];
    selectedChatId: string | null;
    loading: boolean;
    error: string | null;
}

const initialState: ChatState = {
    list: [],
    selectedChatId: null,
    loading: false,
    error: null,
};

const chatSlice = createSlice({
    name: 'chats',
    initialState,
    reducers: {
        setChats(state, action: PayloadAction<Chat[]>) {
            state.list = action.payload;
            state.loading = false;
            state.error = null;
        },
        setSelectedChat(state, action: PayloadAction<string>) {
            state.selectedChatId = action.payload;
        },
        pushChat(state, action: PayloadAction<Chat>) {
            state.list.push(action.payload);
        },
        updateChat(state, action: PayloadAction<{id: string, updates: Partial<Chat>}>) {
            const index = state.list.findIndex(c => c.id === action.payload.id);
            if (index !== -1) {
                state.list[index] = { ...state.list[index], ...action.payload.updates };
            }
        },
        removeChat(state, action: PayloadAction<string>) {
            state.list = state.list.filter(c => c.id !== action.payload);
            if (state.selectedChatId === action.payload) {
                state.selectedChatId = null;
            }
        },
        updateChatUnread(state, action: PayloadAction<{id: string, unread: number}>) {
            const chat = state.list.find(c => c.id === action.payload.id);
            if (chat) {
                chat.unread = action.payload.unread;
            }
        },
        setLoading(state, action: PayloadAction<boolean>) {
            state.loading = action.payload;
        },
        setError(state, action: PayloadAction<string | null>) {
            state.error = action.payload;
            state.loading = false;
        },
        clearError(state) {
            state.error = null;
        },
        updateChatTitle(state, action: PayloadAction<{ chatId: string; title: string }>) {
            const chat = state.list.find(c => c.id === action.payload.chatId);
            if (chat) {
                chat.title = action.payload.title;
            }
        },
        toggleStarChat(state, action: PayloadAction<string>) {
            const index = state.list.findIndex(c => c.id === action.payload);
            if (index !== -1) {
                const isCurrentlyStarred = state.list[index].isStarred || false;
                state.list[index].isStarred = !isCurrentlyStarred;

                // If starring, set starOrder to current max + 1
                if (!isCurrentlyStarred) {
                    const maxOrder = Math.max(
                        0,
                        ...state.list
                            .filter(c => c.isStarred)
                            .map(c => c.starOrder || 0)
                    );
                    state.list[index].starOrder = maxOrder + 1;
                } else {
                    // If unstarring, remove starOrder
                    state.list[index].starOrder = undefined;
                }
            }
        },
        updateChatStarOrder(state, action: PayloadAction<{id: string, starOrder: number}>) {
            const index = state.list.findIndex(c => c.id === action.payload.id);
            if (index !== -1) {
                state.list[index].starOrder = action.payload.starOrder;
            }
        },
    },
});

export const {
    setChats,
    setSelectedChat,
    pushChat,
    updateChat,
    removeChat,
    updateChatUnread,
    setLoading,
    setError,
    clearError,
    updateChatTitle,
    toggleStarChat,
    updateChatStarOrder
} = chatSlice.actions;

export default chatSlice.reducer;
