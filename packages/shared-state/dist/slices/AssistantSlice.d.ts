import { Assistant } from '@bgos/shared-types';
export interface AssistantState {
    list: Assistant[];
    selectedAssistantId: string | null;
    loading: boolean;
    error: string | null;
}
export declare const setAssistants: import("@reduxjs/toolkit").ActionCreatorWithPayload<Assistant[], "assistants/setAssistants">, setSelectedAssistant: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "assistants/setSelectedAssistant">, addAssistant: import("@reduxjs/toolkit").ActionCreatorWithPayload<Assistant, "assistants/addAssistant">, updateAssistant: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    id: string;
    updates: Partial<Assistant>;
}, "assistants/updateAssistant">, removeAssistant: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "assistants/removeAssistant">, setLoading: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean, "assistants/setLoading">, setError: import("@reduxjs/toolkit").ActionCreatorWithPayload<string | null, "assistants/setError">, clearError: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"assistants/clearError">, toggleStarAssistant: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "assistants/toggleStarAssistant">, updateAssistantStarOrder: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    id: string;
    starOrder: number;
}, "assistants/updateAssistantStarOrder">;
declare const _default: import("redux").Reducer<AssistantState>;
export default _default;
