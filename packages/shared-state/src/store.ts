import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/UserSlice';
import assistantsReducer from './slices/AssistantSlice';
import chatsReducer from './slices/ChatSlice';
import chatHistoryReducer from './slices/ChatHistorySlice';
import uiReducer from './slices/UISlice';
import voiceReducer from './slices/voiceSlice';

export const createStore = () => {
    return configureStore({
        reducer: {
            user: userReducer,
            assistants: assistantsReducer,
            chats: chatsReducer,
            chatHistory: chatHistoryReducer,
            ui: uiReducer,
            voice: voiceReducer,
        },
    });
};

export type RootState = ReturnType<ReturnType<typeof createStore>['getState']>;
export type AppDispatch = ReturnType<typeof createStore>['dispatch'];
