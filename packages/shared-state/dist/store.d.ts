export declare const createStore: () => import("@reduxjs/toolkit").EnhancedStore<{
    user: import("./slices/UserSlice").UserState;
    assistants: import("./slices/AssistantSlice").AssistantState;
    chats: import("./slices/ChatSlice").ChatState;
    chatHistory: import("./slices/ChatHistorySlice").ChatHistoryState;
    ui: import("./slices/UISlice").UIState;
    voice: import("./slices/voiceSlice").VoiceState;
}, import("redux").UnknownAction, import("@reduxjs/toolkit").Tuple<[import("redux").StoreEnhancer<{
    dispatch: import("redux-thunk").ThunkDispatch<{
        user: import("./slices/UserSlice").UserState;
        assistants: import("./slices/AssistantSlice").AssistantState;
        chats: import("./slices/ChatSlice").ChatState;
        chatHistory: import("./slices/ChatHistorySlice").ChatHistoryState;
        ui: import("./slices/UISlice").UIState;
        voice: import("./slices/voiceSlice").VoiceState;
    }, undefined, import("redux").UnknownAction>;
}>, import("redux").StoreEnhancer]>>;
export type RootState = ReturnType<ReturnType<typeof createStore>['getState']>;
export type AppDispatch = ReturnType<typeof createStore>['dispatch'];
