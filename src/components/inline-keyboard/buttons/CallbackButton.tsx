import React from 'react';
import type { InlineKeyboardButton } from '@bgos/shared-types';

interface CallbackButtonProps {
    button: InlineKeyboardButton;
    isLoading: boolean;
    onClick: () => void;
}

const CallbackButton: React.FC<CallbackButtonProps> = ({
    button,
    isLoading,
    onClick,
}) => {
    return (
        <button
            onClick={onClick}
            disabled={isLoading}
            className={`
                inline-flex items-center justify-center
                px-4 py-2 rounded-lg
                text-white text-sm font-medium
                transition-all duration-200
                min-w-[80px]
                ${isLoading
                    ? 'opacity-70 cursor-wait'
                    : 'cursor-pointer hover:opacity-90'
                }
            `}
            style={{
                fontFamily: 'Styrene-B',
                backgroundColor: 'var(--color-dark-bg)',
                border: '1px solid var(--color-white-4-10)',
            }}
            onMouseEnter={(e) => {
                if (!isLoading) {
                    e.currentTarget.style.borderColor = '#FFD700';
                }
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-white-4-10)';
            }}
        >
            {isLoading ? (
                <svg
                    className="animate-spin h-4 w-4 mr-2"
                    viewBox="0 0 24 24"
                    fill="none"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            ) : null}
            {button.text}
        </button>
    );
};

export default CallbackButton;
