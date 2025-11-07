import { createSlice } from '@reduxjs/toolkit';
const initialState = {
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
        setUser(state, action) {
            state.currentUser = action.payload;
            state.isAuthenticated = true;
            state.loading = false;
            state.error = null;
        },
        setToken(state, action) {
            state.token = action.payload;
        },
        login(state, action) {
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
        updateUser(state, action) {
            if (state.currentUser) {
                state.currentUser = { ...state.currentUser, ...action.payload };
            }
        },
        updateUserPreferences(state, action) {
            if (state.currentUser) {
                state.currentUser.preferences = {
                    ...state.currentUser.preferences,
                    ...action.payload
                };
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
    },
});
export const { setUser, setToken, login, logout, updateUser, updateUserPreferences, setLoading, setError, clearError, } = userSlice.actions;
export default userSlice.reducer;
