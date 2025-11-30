import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { InlineKeyboardButton, InlineInputState } from '@bgos/shared-types';

export interface InlineKeyboardState {
    /** Currently loading buttons (messageId -> buttonId or callback_data) */
    loadingButtons: { [messageId: string]: string | null };

    /** Currently open inline input state */
    activeInput: InlineInputState | null;
}

const initialState: InlineKeyboardState = {
    loadingButtons: {},
    activeInput: null,
};

const inlineKeyboardSlice = createSlice({
    name: 'inlineKeyboard',
    initialState,
    reducers: {
        setButtonLoading(state, action: PayloadAction<{ messageId: string; buttonId: string | null }>) {
            state.loadingButtons[action.payload.messageId] = action.payload.buttonId;
        },

        clearButtonLoading(state, action: PayloadAction<string>) {
            delete state.loadingButtons[action.payload];
        },

        openInlineInput(state, action: PayloadAction<{ messageId: string; button: InlineKeyboardButton }>) {
            state.activeInput = {
                messageId: action.payload.messageId,
                button: action.payload.button,
                value: '',
                isSubmitting: false,
            };
        },

        updateInlineInputValue(state, action: PayloadAction<string>) {
            if (state.activeInput) {
                state.activeInput.value = action.payload;
            }
        },

        setInlineInputSubmitting(state, action: PayloadAction<boolean>) {
            if (state.activeInput) {
                state.activeInput.isSubmitting = action.payload;
            }
        },

        closeInlineInput(state) {
            state.activeInput = null;
        },

        clearAllLoadingStates(state) {
            state.loadingButtons = {};
            state.activeInput = null;
        },
    },
});

export const {
    setButtonLoading,
    clearButtonLoading,
    openInlineInput,
    updateInlineInputValue,
    setInlineInputSubmitting,
    closeInlineInput,
    clearAllLoadingStates,
} = inlineKeyboardSlice.actions;

export default inlineKeyboardSlice.reducer;
