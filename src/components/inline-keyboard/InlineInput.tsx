import React, { useRef, useEffect } from 'react';

interface InlineInputProps {
    placeholder?: string;
    value: string;
    isSubmitting: boolean;
    onChange: (value: string) => void;
    onSubmit: (value: string) => void;
    onCancel: () => void;
}

const InlineInput: React.FC<InlineInputProps> = ({
    placeholder = 'Enter your response...',
    value,
    isSubmitting,
    onChange,
    onSubmit,
    onCancel,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus when opened
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) {
                onSubmit(value);
            }
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    return (
        <div
            className="mt-3 p-3 rounded-lg animate-slideDown"
            style={{
                backgroundColor: 'var(--color-dark-bg)',
                border: '1px solid var(--color-white-4-10)',
                animation: 'slideDown 0.2s ease-out',
            }}
        >
            <style>
                {`
                    @keyframes slideDown {
                        from {
                            opacity: 0;
                            transform: translateY(-10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                `}
            </style>
            <div className="flex gap-2">
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={isSubmitting}
                    className="
                        flex-1 px-3 py-2 rounded-lg
                        text-white text-sm
                        focus:outline-none focus:ring-1 focus:ring-yellow-500
                        placeholder-gray-400
                        disabled:opacity-50
                    "
                    style={{
                        backgroundColor: 'rgb(48, 48, 46)',
                        border: '1px solid var(--color-white-4-10)',
                        fontFamily: 'Styrene-B',
                    }}
                />
                <button
                    onClick={() => onSubmit(value)}
                    disabled={isSubmitting || !value.trim()}
                    className="
                        px-4 py-2 rounded-lg
                        text-black text-sm font-medium
                        transition-all duration-200
                        disabled:opacity-50 disabled:cursor-not-allowed
                    "
                    style={{
                        backgroundColor: '#FFD700',
                        fontFamily: 'Styrene-B',
                    }}
                >
                    {isSubmitting ? (
                        <svg
                            className="animate-spin h-4 w-4"
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
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                        </svg>
                    ) : (
                        'Send'
                    )}
                </button>
                <button
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="
                        px-3 py-2 rounded-lg
                        text-white text-sm
                        transition-all duration-200
                        disabled:opacity-50 disabled:cursor-not-allowed
                    "
                    style={{
                        backgroundColor: 'var(--color-dark-bg)',
                        border: '1px solid var(--color-white-4-10)',
                        fontFamily: 'Styrene-B',
                    }}
                    onMouseEnter={(e) => {
                        if (!isSubmitting) {
                            e.currentTarget.style.backgroundColor = 'rgb(55, 55, 53)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-dark-bg)';
                    }}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default InlineInput;
