import { createAsyncThunk } from '@reduxjs/toolkit';
import { AppDispatch, RootState } from '../config/storeConfig';
import { 
    setAssistants, 
    setLoading as setAssistantsLoading, 
    setError as setAssistantsError 
} from '../slices/AssistantSlice';
import { 
    setChats, 
    setLoading as setChatsLoading, 
    setError as setChatsError 
} from '../slices/ChatSlice';
import { 
    setChatHistory, 
    addMessage, 
    setLoading as setChatHistoryLoading, 
    setError as setChatHistoryError 
} from '../slices/ChatHistorySlice';
import { 
    setLoggedIn, 
    setLoading as setUILoading, 
    setError as setUIError,
    setSidebarCollapsed,
    setSelectedArtifact,
    setShowArtifacts
} from '../slices/UISlice';
import { 
    login as userLogin, 
    logout as userLogout, 
    setLoading as setUserLoading, 
    setError as setUserError 
} from '../slices/UserSlice';
import { ChatHistory } from '../types/model/ChatHistory';

// Assistant thunks
export const fetchAssistants = createAsyncThunk(
    'assistants/fetchAssistants',
    async (_, { dispatch }) => {
        try {
            dispatch(setAssistantsLoading(true));
            // Simulate API call
            const response = await fetch('/api/assistants');
            const data = await response.json();
            dispatch(setAssistants(data));
            return data;
        } catch (error) {
            dispatch(setAssistantsError(error.message));
            throw error;
        }
    }
);

// Chat thunks
export const fetchChats = createAsyncThunk(
    'chats/fetchChats',
    async (assistantId: string, { dispatch }) => {
        try {
            dispatch(setChatsLoading(true));
            // Simulate API call
            const response = await fetch(`/api/assistants/${assistantId}/chats`);
            const data = await response.json();
            dispatch(setChats(data));
            return data;
        } catch (error) {
            dispatch(setChatsError(error.message));
            throw error;
        }
    }
);

export const createNewChat = createAsyncThunk(
    'chats/createNewChat',
    async ({ assistantId, title }: { assistantId: string; title: string }, { dispatch, getState }) => {
        try {
            dispatch(setChatsLoading(true));
            // Simulate API call
            const response = await fetch('/api/chats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assistantId, title }),
            });
            const newChat = await response.json();
            
            const state = getState() as RootState;
            const currentChats = state.chats.list;
            dispatch(setChats([...currentChats, newChat]));
            
            return newChat;
        } catch (error) {
            dispatch(setChatsError(error.message));
            throw error;
        }
    }
);

// Chat History thunks
export const fetchChatHistory = createAsyncThunk(
    'chatHistory/fetchChatHistory',
    async (chatId: string, { dispatch }) => {
        try {
            dispatch(setChatHistoryLoading(true));
            // Simulate API call
            const response = await fetch(`/api/chats/${chatId}/history`);
            const data = await response.json();
            dispatch(setChatHistory(data));
            return data;
        } catch (error) {
            dispatch(setChatHistoryError(error.message));
            throw error;
        }
    }
);

export const sendMessage = createAsyncThunk(
    'chatHistory/sendMessage',
    async (message: Omit<ChatHistory, 'id' | 'sentDate'>, { dispatch, getState }) => {
        try {
            dispatch(setChatHistoryLoading(true));
            
            const newMessage: ChatHistory = {
                ...message,
                id: String(Date.now()),
                sentDate: new Date().toISOString(),
            };
            
            // Simulate API call
            const response = await fetch(`/api/chats/${message.chatId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMessage),
            });
            
            const savedMessage = await response.json();
            dispatch(addMessage(savedMessage));
            
            return savedMessage;
        } catch (error) {
            dispatch(setChatHistoryError(error.message));
            throw error;
        }
    }
);

// User thunks
export const loginUser = createAsyncThunk(
    'user/login',
    async (credentials: { email: string; password: string }, { dispatch }) => {
        try {
            dispatch(setUserLoading(true));
            dispatch(setUILoading(true));
            
            // Simulate API call
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });
            
            const { user, token } = await response.json();
            
            dispatch(userLogin({ user, token }));
            dispatch(setLoggedIn(true));
            
            return { user, token };
        } catch (error) {
            dispatch(setUserError(error.message));
            dispatch(setUIError(error.message));
            throw error;
        }
    }
);

export const logoutUser = createAsyncThunk(
    'user/logout',
    async (_, { dispatch }) => {
        try {
            dispatch(setUserLoading(true));
            
            // Simulate API call
            await fetch('/api/auth/logout', { method: 'POST' });
            
            dispatch(userLogout());
            dispatch(setLoggedIn(false));
        } catch (error) {
            dispatch(setUserError(error.message));
            throw error;
        }
    }
);

// UI thunks
export const toggleSidebar = createAsyncThunk(
    'ui/toggleSidebar',
    async (_, { dispatch, getState }) => {
        const state = getState() as RootState;
        const isCollapsed = state.ui.sidebarCollapsed;
        dispatch(setSidebarCollapsed(!isCollapsed));
    }
);

export const showArtifacts = createAsyncThunk(
    'ui/showArtifacts',
    async (artifact: any, { dispatch }) => {
        dispatch(setSelectedArtifact(artifact));
        dispatch(setShowArtifacts(true));
    }
);

export const hideArtifacts = createAsyncThunk(
    'ui/hideArtifacts',
    async (_, { dispatch }) => {
        dispatch(setSelectedArtifact(null));
        dispatch(setShowArtifacts(false));
    }
); 