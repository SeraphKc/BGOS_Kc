import React from 'react';
import type { InlineKeyboardButton } from '@bgos/shared-types';

interface InputButtonProps {
    button: InlineKeyboardButton;
    onClick: () => void;
}

const InputButton: React.FC<InputButtonProps> = ({
    button,
    onClick,
}) => {
    return (
        <button
            onClick={onClick}
            className="
                inline-flex items-center justify-center gap-1.5
                px-4 py-2 rounded-lg
                text-white text-sm font-medium
                transition-all duration-200
                min-w-[80px]
                cursor-pointer
            "
            style={{
                fontFamily: 'Styrene-B',
                backgroundColor: 'var(--color-dark-bg)',
                border: '1px solid var(--color-white-4-10)',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#FFD700';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-white-4-10)';
            }}
        >
            {button.text}
            <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
            </svg>
        </button>
    );
};

export default InputButton;
