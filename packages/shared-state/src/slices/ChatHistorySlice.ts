import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatHistory, MessageStatus } from '@bgos/shared-types';

export interface ChatHistoryState {
    list: ChatHistory[];
    loading: boolean;
    error: string | null;
    lastMessageId: string | null;
}

const initialState: ChatHistoryState = {
    list: [],
    loading: false,
    error: null,
    lastMessageId: null,
};

const chatHistorySlice = createSlice({
    name: 'chatHistory',
    initialState,
    reducers: {
        setChatHistory(state, action: PayloadAction<ChatHistory[]>) {
            state.list = action.payload;
            state.loading = false;
            state.error = null;
            if (action.payload.length > 0) {
                state.lastMessageId = action.payload[action.payload.length - 1].id || null;
            }
        },
        addMessage(state, action: PayloadAction<ChatHistory>) {
            state.list.push(action.payload);
            state.lastMessageId = action.payload.id || null;
        },
        updateMessage(state, action: PayloadAction<{id: string, updates: Partial<ChatHistory>}>) {
            const index = state.list.findIndex(m => m.id === action.payload.id);
            if (index !== -1) {
                state.list[index] = { ...state.list[index], ...action.payload.updates };
            }
        },
        updateMessageStatus(state, action: PayloadAction<{id: string, status: MessageStatus}>) {
            const index = state.list.findIndex(m => m.id === action.payload.id);
            if (index !== -1) {
                state.list[index].status = action.payload.status;
            }
        },
        removeMessage(state, action: PayloadAction<string>) {
            state.list = state.list.filter(m => m.id !== action.payload);
        },
        clearChatHistory(state) {
            state.list = [];
            state.lastMessageId = null;
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
    },
});

export const {
    setChatHistory,
    addMessage,
    updateMessage,
    updateMessageStatus,
    removeMessage,
    clearChatHistory,
    setLoading,
    setError,
    clearError
} = chatHistorySlice.actions;

export default chatHistorySlice.reducer;
