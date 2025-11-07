import { createSlice } from '@reduxjs/toolkit';
const initialState = {
    list: [],
    selectedAssistantId: null,
    loading: false,
    error: null,
};
const assistantSlice = createSlice({
    name: 'assistants',
    initialState,
    reducers: {
        setAssistants(state, action) {
            state.list = action.payload;
            state.loading = false;
            state.error = null;
        },
        setSelectedAssistant(state, action) {
            state.selectedAssistantId = action.payload;
        },
        addAssistant(state, action) {
            state.list.push(action.payload);
        },
        updateAssistant(state, action) {
            const index = state.list.findIndex(a => a.id === action.payload.id);
            if (index !== -1) {
                state.list[index] = { ...state.list[index], ...action.payload.updates };
            }
        },
        removeAssistant(state, action) {
            state.list = state.list.filter(a => a.id !== action.payload);
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
        toggleStarAssistant(state, action) {
            const index = state.list.findIndex(a => a.id === action.payload);
            if (index !== -1) {
                const isCurrentlyStarred = state.list[index].isStarred || false;
                state.list[index].isStarred = !isCurrentlyStarred;
                // If starring, set starOrder to current max + 1
                if (!isCurrentlyStarred) {
                    const maxOrder = Math.max(0, ...state.list
                        .filter(a => a.isStarred)
                        .map(a => a.starOrder || 0));
                    state.list[index].starOrder = maxOrder + 1;
                }
                else {
                    // If unstarring, remove starOrder
                    state.list[index].starOrder = undefined;
                }
            }
        },
        updateAssistantStarOrder(state, action) {
            const index = state.list.findIndex(a => a.id === action.payload.id);
            if (index !== -1) {
                state.list[index].starOrder = action.payload.starOrder;
            }
        },
    },
});
export const { setAssistants, setSelectedAssistant, addAssistant, updateAssistant, removeAssistant, setLoading, setError, clearError, toggleStarAssistant, updateAssistantStarOrder } = assistantSlice.actions;
export default assistantSlice.reducer;
