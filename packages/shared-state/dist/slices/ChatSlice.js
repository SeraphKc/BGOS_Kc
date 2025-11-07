import { createSlice } from '@reduxjs/toolkit';
const initialState = {
    list: [],
    selectedChatId: null,
    loading: false,
    error: null,
};
const chatSlice = createSlice({
    name: 'chats',
    initialState,
    reducers: {
        setChats(state, action) {
            state.list = action.payload;
            state.loading = false;
            state.error = null;
        },
        setSelectedChat(state, action) {
            state.selectedChatId = action.payload;
        },
        pushChat(state, action) {
            state.list.push(action.payload);
        },
        updateChat(state, action) {
            const index = state.list.findIndex(c => c.id === action.payload.id);
            if (index !== -1) {
                state.list[index] = { ...state.list[index], ...action.payload.updates };
            }
        },
        removeChat(state, action) {
            state.list = state.list.filter(c => c.id !== action.payload);
            if (state.selectedChatId === action.payload) {
                state.selectedChatId = null;
            }
        },
        updateChatUnread(state, action) {
            const chat = state.list.find(c => c.id === action.payload.id);
            if (chat) {
                chat.unread = action.payload.unread;
            }
        },
        setLoading(state, action) {
            state.loading = action.payload;
        },
        setError(state, action) {
            state.error = action.payload;
            state.loading = false;
        },
        clearError(state) {
            state.error = null;
        },
        updateChatTitle(state, action) {
            const chat = state.list.find(c => c.id === action.payload.chatId);
            if (chat) {
                chat.title = action.payload.title;
            }
        },
        toggleStarChat(state, action) {
            const index = state.list.findIndex(c => c.id === action.payload);
            if (index !== -1) {
                const isCurrentlyStarred = state.list[index].isStarred || false;
                state.list[index].isStarred = !isCurrentlyStarred;
                // If starring, set starOrder to current max + 1
                if (!isCurrentlyStarred) {
                    const maxOrder = Math.max(0, ...state.list
                        .filter(c => c.isStarred)
                        .map(c => c.starOrder || 0));
                    state.list[index].starOrder = maxOrder + 1;
                }
                else {
                    // If unstarring, remove starOrder
                    state.list[index].starOrder = undefined;
                }
            }
        },
        updateChatStarOrder(state, action) {
            const index = state.list.findIndex(c => c.id === action.payload.id);
            if (index !== -1) {
                state.list[index].starOrder = action.payload.starOrder;
            }
        },
    },
});
export const { setChats, setSelectedChat, pushChat, updateChat, removeChat, updateChatUnread, setLoading, setError, clearError, updateChatTitle, toggleStarChat, updateChatStarOrder } = chatSlice.actions;
export default chatSlice.reducer;
