import React from 'react';
import type { InlineKeyboardButton } from '@bgos/shared-types';
import CallbackButton from './buttons/CallbackButton';
import UrlButton from './buttons/UrlButton';
import CopyButton from './buttons/CopyButton';
import InputButton from './buttons/InputButton';

interface InlineKeyboardButtonProps {
    button: InlineKeyboardButton;
    buttonId: string;
    isLoading: boolean;
    onCallbackClick: (callbackData: string, buttonId: string) => void;
    onUrlClick: (url: string) => void;
    onCopyClick: (text: string) => void;
    onInputOpen: (button: InlineKeyboardButton) => void;
}

const InlineKeyboardButtonComponent: React.FC<InlineKeyboardButtonProps> = ({
    button,
    buttonId,
    isLoading,
    onCallbackClick,
    onUrlClick,
    onCopyClick,
    onInputOpen,
}) => {
    switch (button.type) {
        case 'callback':
            return (
                <CallbackButton
                    button={button}
                    isLoading={isLoading}
                    onClick={() => onCallbackClick(button.callback_data || '', buttonId)}
                />
            );

        case 'url':
            return (
                <UrlButton
                    button={button}
                    onClick={() => onUrlClick(button.url || '')}
                />
            );

        case 'copy':
            return (
                <CopyButton
                    button={button}
                    onClick={() => onCopyClick(button.copy_text || '')}
                />
            );

        case 'input':
            return (
                <InputButton
                    button={button}
                    onClick={() => onInputOpen(button)}
                />
            );

        default:
            // Fallback for unknown button types
            return (
                <button
                    className="px-4 py-2 rounded-lg bg-gray-700 text-white text-sm opacity-50 cursor-not-allowed"
                    disabled
                >
                    {button.text}
                </button>
            );
    }
};

export default InlineKeyboardButtonComponent;
