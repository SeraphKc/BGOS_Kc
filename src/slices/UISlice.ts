import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
    isLoggedIn: boolean;
    sidebarCollapsed: boolean;
    showArtifacts: boolean;
    selectedArtifact: any | null;
    showRightSidebar: boolean;
    isLoading: boolean;
    error: string | null;
    theme: 'dark' | 'light';
    language: string;
}

const initialState: UIState = {
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
        setLoggedIn(state, action: PayloadAction<boolean>) {
            state.isLoggedIn = action.payload;
        },
        toggleSidebar(state) {
            state.sidebarCollapsed = !state.sidebarCollapsed;
        },
        setSidebarCollapsed(state, action: PayloadAction<boolean>) {
            state.sidebarCollapsed = action.payload;
        },
        setShowArtifacts(state, action: PayloadAction<boolean>) {
            state.showArtifacts = action.payload;
        },
        setSelectedArtifact(state, action: PayloadAction<any | null>) {
            state.selectedArtifact = action.payload;
        },
        setShowRightSidebar(state, action: PayloadAction<boolean>) {
            state.showRightSidebar = action.payload;
        },
        setLoading(state, action: PayloadAction<boolean>) {
            state.isLoading = action.payload;
        },
        setError(state, action: PayloadAction<string | null>) {
            state.error = action.payload;
        },
        clearError(state) {
            state.error = null;
        },
        setTheme(state, action: PayloadAction<'dark' | 'light'>) {
            state.theme = action.payload;
        },
        setLanguage(state, action: PayloadAction<string>) {
            state.language = action.payload;
        },
    },
});

export const {
    setLoggedIn,
    toggleSidebar,
    setSidebarCollapsed,
    setShowArtifacts,
    setSelectedArtifact,
    setShowRightSidebar,
    setLoading,
    setError,
    clearError,
    setTheme,
    setLanguage,
} = uiSlice.actions;

export default uiSlice.reducer; 