export interface User {
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
export interface UserState {
    currentUser: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}
export declare const setUser: import("@reduxjs/toolkit").ActionCreatorWithPayload<User, "user/setUser">, setToken: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "user/setToken">, login: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    user: User;
    token: string;
}, "user/login">, logout: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"user/logout">, updateUser: import("@reduxjs/toolkit").ActionCreatorWithPayload<Partial<User>, "user/updateUser">, updateUserPreferences: import("@reduxjs/toolkit").ActionCreatorWithPayload<Partial<{
    theme: "dark" | "light";
    language: string;
    notifications: boolean;
}>, "user/updateUserPreferences">, setLoading: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean, "user/setLoading">, setError: import("@reduxjs/toolkit").ActionCreatorWithPayload<string | null, "user/setError">, clearError: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"user/clearError">;
declare const _default: import("redux").Reducer<UserState>;
export default _default;
