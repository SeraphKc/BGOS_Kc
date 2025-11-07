import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {Assistant} from "../types/model/Assistant";

interface AssistantState {
    list: Assistant[];
    selectedAssistantId: string | null;
    loading: boolean;
    error: string | null;
}

const initialState: AssistantState = {
    list: [],
    selectedAssistantId: null,
    loading: false,
    error: null,
};

const assistantSlice = createSlice({
    name: 'assistants',
    initialState,
    reducers: {
        setAssistants(state, action: PayloadAction<Assistant[]>) {
            state.list = action.payload;
            state.loading = false;
            state.error = null;
        },
        setSelectedAssistant(state, action: PayloadAction<string>) {
            state.selectedAssistantId = action.payload;
        },
        addAssistant(state, action: PayloadAction<Assistant>) {
            state.list.push(action.payload);
        },
        updateAssistant(state, action: PayloadAction<{id: string, updates: Partial<Assistant>}>) {
            const index = state.list.findIndex(a => a.id === action.payload.id);
            if (index !== -1) {
                state.list[index] = { ...state.list[index], ...action.payload.updates };
            }
        },
        removeAssistant(state, action: PayloadAction<string>) {
            state.list = state.list.filter(a => a.id !== action.payload);
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
        toggleStarAssistant(state, action: PayloadAction<string>) {
            const index = state.list.findIndex(a => a.id === action.payload);
            if (index !== -1) {
                const isCurrentlyStarred = state.list[index].isStarred || false;
                state.list[index].isStarred = !isCurrentlyStarred;

                // If starring, set starOrder to current max + 1
                if (!isCurrentlyStarred) {
                    const maxOrder = Math.max(
                        0,
                        ...state.list
                            .filter(a => a.isStarred)
                            .map(a => a.starOrder || 0)
                    );
                    state.list[index].starOrder = maxOrder + 1;
                } else {
                    // If unstarring, remove starOrder
                    state.list[index].starOrder = undefined;
                }
            }
        },
        updateAssistantStarOrder(state, action: PayloadAction<{id: string, starOrder: number}>) {
            const index = state.list.findIndex(a => a.id === action.payload.id);
            if (index !== -1) {
                state.list[index].starOrder = action.payload.starOrder;
            }
        },
    },
});

export const {
    setAssistants,
    setSelectedAssistant,
    addAssistant,
    updateAssistant,
    removeAssistant,
    setLoading,
    setError,
    clearError,
    toggleStarAssistant,
    updateAssistantStarOrder
} = assistantSlice.actions;

export default assistantSlice.reducer;
