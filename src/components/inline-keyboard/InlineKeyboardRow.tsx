import React from 'react';
import type { InlineKeyboardButton, InlineKeyboardRow as RowType } from '@bgos/shared-types';
import InlineKeyboardButtonComponent from './InlineKeyboardButton';

interface InlineKeyboardRowProps {
    buttons: RowType;
    loadingButtonId: string | null;
    onCallbackClick: (callbackData: string, buttonId: string) => void;
    onUrlClick: (url: string) => void;
    onCopyClick: (text: string) => void;
    onInputOpen: (button: InlineKeyboardButton) => void;
}

const InlineKeyboardRow: React.FC<InlineKeyboardRowProps> = ({
    buttons,
    loadingButtonId,
    onCallbackClick,
    onUrlClick,
    onCopyClick,
    onInputOpen,
}) => {
    return (
        <div className="flex gap-2 flex-wrap">
            {buttons.map((button, buttonIndex) => {
                const buttonId = button.id || button.callback_data || `btn-${buttonIndex}`;
                const isLoading = loadingButtonId === buttonId;

                return (
                    <InlineKeyboardButtonComponent
                        key={buttonId}
                        button={button}
                        buttonId={buttonId}
                        isLoading={isLoading}
                        onCallbackClick={onCallbackClick}
                        onUrlClick={onUrlClick}
                        onCopyClick={onCopyClick}
                        onInputOpen={onInputOpen}
                    />
                );
            })}
        </div>
    );
};

export default InlineKeyboardRow;
