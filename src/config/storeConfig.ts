import { configureStore } from '@reduxjs/toolkit';
import assistantReducer from '../slices/AssistantSlice';
import chatReducer from '../slices/ChatSlice';
import chatHistoryReducer from '../slices/ChatHistorySlice';
import uiReducer from '../slices/UISlice';
import userReducer from '../slices/UserSlice';
import { remoteDatabaseApi } from '../services/DatabaseSyncService';

export const store = configureStore({
    reducer: {
        assistants: assistantReducer,
        chats: chatReducer,
        chatHistory: chatHistoryReducer,
        ui: uiReducer,
        user: userReducer,
        [remoteDatabaseApi.reducerPath]: remoteDatabaseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(remoteDatabaseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
