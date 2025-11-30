import React from 'react';
import type { InlineKeyboardButton } from '@bgos/shared-types';

interface UrlButtonProps {
    button: InlineKeyboardButton;
    onClick: () => void;
}

const UrlButton: React.FC<UrlButtonProps> = ({
    button,
    onClick,
}) => {
    const handleClick = () => {
        // Open URL in external browser
        if (button.url) {
            window.open(button.url, '_blank', 'noopener,noreferrer');
        }
        onClick();
    };

    return (
        <button
            onClick={handleClick}
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
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
            </svg>
        </button>
    );
};

export default UrlButton;
