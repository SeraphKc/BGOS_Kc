import { createSlice } from '@reduxjs/toolkit';
const initialState = {
    isLoggedIn: false,
    sidebarCollapsed: false,
    showArtifacts: false,
    selectedArtifact: null,
    showRightSidebar: false,
    isLoading: false,
    error: null,
    theme: 'dark',
    language: 'en',
};
const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setLoggedIn(state, action) {
            state.isLoggedIn = action.payload;
        },
        toggleSidebar(state) {
            state.sidebarCollapsed = !state.sidebarCollapsed;
        },
        setSidebarCollapsed(state, action) {
            state.sidebarCollapsed = action.payload;
        },
        setShowArtifacts(state, action) {
            state.showArtifacts = action.payload;
        },
        setSelectedArtifact(state, action) {
            state.selectedArtifact = action.payload;
        },
        setShowRightSidebar(state, action) {
            state.showRightSidebar = action.payload;
        },
        setLoading(state, action) {
            state.isLoading = action.payload;
        },
        setError(state, action) {
            state.error = action.payload;
        },
        clearError(state) {
            state.error = null;
        },
        setTheme(state, action) {
            state.theme = action.payload;
        },
        setLanguage(state, action) {
            state.language = action.payload;
        },
    },
});
export const { setLoggedIn, toggleSidebar, setSidebarCollapsed, setShowArtifacts, setSelectedArtifact, setShowRightSidebar, setLoading, setError, clearError, setTheme, setLanguage, } = uiSlice.actions;
export default uiSlice.reducer;
