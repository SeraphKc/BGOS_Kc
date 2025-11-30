import React, { useState } from 'react';
import type { InlineKeyboardButton } from '@bgos/shared-types';

interface CopyButtonProps {
    button: InlineKeyboardButton;
    onClick: () => void;
}

const CopyButton: React.FC<CopyButtonProps> = ({
    button,
    onClick,
}) => {
    const [copied, setCopied] = useState(false);

    const handleClick = async () => {
        if (button.copy_text) {
            try {
                await navigator.clipboard.writeText(button.copy_text);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
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
                border: copied ? '1px solid #22c55e' : '1px solid var(--color-white-4-10)',
            }}
            onMouseEnter={(e) => {
                if (!copied) {
                    e.currentTarget.style.borderColor = '#FFD700';
                }
            }}
            onMouseLeave={(e) => {
                if (!copied) {
                    e.currentTarget.style.borderColor = 'var(--color-white-4-10)';
                }
            }}
        >
            {copied ? (
                <>
                    <svg
                        className="w-4 h-4 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                    Copied!
                </>
            ) : (
                <>
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
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                    </svg>
                </>
            )}
        </button>
    );
};

export default CopyButton;
