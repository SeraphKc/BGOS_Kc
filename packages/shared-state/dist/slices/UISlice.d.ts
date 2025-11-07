export interface UIState {
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
export declare const setLoggedIn: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean, "ui/setLoggedIn">, toggleSidebar: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"ui/toggleSidebar">, setSidebarCollapsed: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean, "ui/setSidebarCollapsed">, setShowArtifacts: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean, "ui/setShowArtifacts">, setSelectedArtifact: import("@reduxjs/toolkit").ActionCreatorWithPayload<any, "ui/setSelectedArtifact">, setShowRightSidebar: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean, "ui/setShowRightSidebar">, setLoading: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean, "ui/setLoading">, setError: import("@reduxjs/toolkit").ActionCreatorWithPayload<string | null, "ui/setError">, clearError: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"ui/clearError">, setTheme: import("@reduxjs/toolkit").ActionCreatorWithPayload<"dark" | "light", "ui/setTheme">, setLanguage: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "ui/setLanguage">;
declare const _default: import("redux").Reducer<UIState>;
export default _default;
