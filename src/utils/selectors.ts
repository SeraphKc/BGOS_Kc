import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../config/storeConfig';

// Basic selectors
export const selectAssistants = (state: RootState) => state.assistants.list;
export const selectSelectedAssistantId = (state: RootState) => state.assistants.selectedAssistantId;
export const selectAssistantsLoading = (state: RootState) => state.assistants.loading;
export const selectAssistantsError = (state: RootState) => state.assistants.error;

export const selectChats = (state: RootState) => state.chats.list;
export const selectSelectedChatId = (state: RootState) => state.chats.selectedChatId;
export const selectChatsLoading = (state: RootState) => state.chats.loading;
export const selectChatsError = (state: RootState) => state.chats.error;

export const selectChatHistory = (state: RootState) => state.chatHistory.list;
export const selectChatHistoryLoading = (state: RootState) => state.chatHistory.loading;
export const selectChatHistoryError = (state: RootState) => state.chatHistory.error;
export const selectLastMessageId = (state: RootState) => state.chatHistory.lastMessageId;

export const selectIsLoggedIn = (state: RootState) => state.ui.isLoggedIn;
export const selectSidebarCollapsed = (state: RootState) => state.ui.sidebarCollapsed;
export const selectShowArtifacts = (state: RootState) => state.ui.showArtifacts;
export const selectSelectedArtifact = (state: RootState) => state.ui.selectedArtifact;
export const selectShowRightSidebar = (state: RootState) => {
    return state.ui.showRightSidebar;
};
export const selectUILoading = (state: RootState) => state.ui.isLoading;
export const selectUIError = (state: RootState) => state.ui.error;
export const selectTheme = (state: RootState) => state.ui.theme;
export const selectLanguage = (state: RootState) => state.ui.language;

export const selectCurrentUser = (state: RootState) => state.user.currentUser;
export const selectUserToken = (state: RootState) => state.user.token;
export const selectIsAuthenticated = (state: RootState) => state.user.isAuthenticated;
export const selectUserLoading = (state: RootState) => state.user.loading;
export const selectUserError = (state: RootState) => state.user.error;

// Computed selectors
export const selectSelectedAssistant = createSelector(
    [selectAssistants, selectSelectedAssistantId],
    (assistants, selectedId) => assistants.find(a => a.id === selectedId) || null
);

export const selectSelectedChat = createSelector(
    [selectChats, selectSelectedChatId],
    (chats, selectedId) => chats.find(c => c.id === selectedId) || null
);

export const selectChatsByAssistant = createSelector(
    [selectChats],
    (chats) => {
        return chats.reduce((acc, chat) => {
            const key = chat.assistantId;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(chat);
            return acc;
        }, {} as Record<string, typeof chats>);
    }
);

export const selectCurrentChatHistory = createSelector(
    [selectChatHistory, selectSelectedChatId],
    (chatHistory, selectedChatId) => {
        if (!selectedChatId) return [];
        return chatHistory.filter(msg => msg.chatId === selectedChatId);
    }
);

export const selectUnreadChatsCount = createSelector(
    [selectChats],
    (chats) => chats.reduce((total, chat) => total + chat.unread, 0)
);

export const selectUnreadChatsByAssistant = createSelector(
    [selectChats],
    (chats) => {
        return chats.reduce((acc, chat) => {
            const key = chat.assistantId;
            if (!acc[key]) {
                acc[key] = 0;
            }
            acc[key] += chat.unread;
            return acc;
        }, {} as Record<string, number>);
    }
);

export const selectIsEmptyChat = createSelector(
    [selectSelectedChat],
    (selectedChat) => !selectedChat
);

export const selectUserPreferences = createSelector(
    [selectCurrentUser],
    (user) => user?.preferences || null
); 