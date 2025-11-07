import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role?: string;
    preferences: {
        theme: 'dark' | 'light';
        language: string;
        notifications: boolean;
    };
}

interface UserState {
    currentUser: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}

const initialState: UserState = {
    currentUser: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null,
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser(state, action: PayloadAction<User>) {
            state.currentUser = action.payload;
            state.isAuthenticated = true;
            state.loading = false;
            state.error = null;
        },
        setToken(state, action: PayloadAction<string>) {
            state.token = action.payload;
        },
        login(state, action: PayloadAction<{user: User, token: string}>) {
            state.currentUser = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
            state.loading = false;
            state.error = null;
        },
        logout(state) {
            state.currentUser = null;
            state.token = null;
            state.isAuthenticated = false;
            state.loading = false;
            state.error = null;
        },
        updateUser(state, action: PayloadAction<Partial<User>>) {
            if (state.currentUser) {
                state.currentUser = { ...state.currentUser, ...action.payload };
            }
        },
        updateUserPreferences(state, action: PayloadAction<Partial<User['preferences']>>) {
            if (state.currentUser) {
                state.currentUser.preferences = { 
                    ...state.currentUser.preferences, 
                    ...action.payload 
                };
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
    },
});

export const {
    setUser,
    setToken,
    login,
    logout,
    updateUser,
    updateUserPreferences,
    setLoading,
    setError,
    clearError,
} = userSlice.actions;

export default userSlice.reducer; 