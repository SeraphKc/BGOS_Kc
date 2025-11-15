import { configureStore } from '@reduxjs/toolkit';
import assistantReducer from '../slices/AssistantSlice';
import chatReducer from '../slices/ChatSlice';
import chatHistoryReducer from '../slices/ChatHistorySlice';
import uiReducer from '../slices/UISlice';
import userReducer from '../slices/UserSlice';
import voiceReducer from '@bgos/shared-state/dist/slices/voiceSlice';
import { remoteDatabaseApi } from '../services/DatabaseSyncService';

export const store = configureStore({
    reducer: {
        assistants: assistantReducer,
        chats: chatReducer,
        chatHistory: chatHistoryReducer,
        ui: uiReducer,
        user: userReducer,
        voice: voiceReducer,
        [remoteDatabaseApi.reducerPath]: remoteDatabaseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(remoteDatabaseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
