import React from 'react';
import type { InlineKeyboardMarkup, InlineInputState, InlineKeyboardButton } from '@bgos/shared-types';
import InlineKeyboardRow from './InlineKeyboardRow';
import InlineInput from './InlineInput';

interface InlineKeyboardProps {
    messageId: string;
    chatId: string;
    originalText: string;
    markup: InlineKeyboardMarkup;
    loadingButtonId: string | null;
    inlineInputState: InlineInputState | null;
    onCallbackClick: (callbackData: string, buttonId: string) => void;
    onUrlClick: (url: string) => void;
    onCopyClick: (text: string) => void;
    onInputSubmit: (value: string) => void;
    onInputCancel: () => void;
    onInputChange: (value: string) => void;
    onInputOpen: (button: InlineKeyboardButton) => void;
}

const InlineKeyboard: React.FC<InlineKeyboardProps> = ({
    messageId,
    markup,
    loadingButtonId,
    inlineInputState,
    onCallbackClick,
    onUrlClick,
    onCopyClick,
    onInputSubmit,
    onInputCancel,
    onInputChange,
    onInputOpen,
}) => {
    return (
        <div className="inline-keyboard-container mt-3">
            {/* Button Grid */}
            <div className="flex flex-col gap-2">
                {markup.inline_keyboard.map((row, rowIndex) => (
                    <InlineKeyboardRow
                        key={`row-${rowIndex}`}
                        buttons={row}
                        loadingButtonId={loadingButtonId}
                        onCallbackClick={onCallbackClick}
                        onUrlClick={onUrlClick}
                        onCopyClick={onCopyClick}
                        onInputOpen={onInputOpen}
                    />
                ))}
            </div>

            {/* Inline Input (expands below keyboard when input button clicked) */}
            {inlineInputState && inlineInputState.messageId === messageId && (
                <InlineInput
                    placeholder={inlineInputState.button.input_placeholder}
                    value={inlineInputState.value}
                    isSubmitting={inlineInputState.isSubmitting}
                    onChange={onInputChange}
                    onSubmit={onInputSubmit}
                    onCancel={onInputCancel}
                />
            )}
        </div>
    );
};

export default InlineKeyboard;
