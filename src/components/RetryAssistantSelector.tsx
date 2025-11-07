import React, { useState, useRef, useEffect } from 'react';
import { useFloating, offset, flip, shift } from '@floating-ui/react';
import arrowDownIcon from '../assets/icons/arrow-down.svg';
import checkIcon from '../assets/icons/check.svg';

interface RetryAssistantSelectorProps {
    assistants: Array<{ id: string; name: string; subtitle?: string }>;
    currentAssistantId: string;
    onRetryWithAssistant: (assistantId: string) => void;
    className?: string;
}

const RetryAssistantSelector: React.FC<RetryAssistantSelectorProps> = ({
    assistants,
    currentAssistantId,
    onRetryWithAssistant,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const { refs, floatingStyles } = useFloating({
        placement: 'top',
        open: isOpen,
        onOpenChange: setIsOpen,
        middleware: [
            offset(8),
            flip(),
            shift()
        ]
    });

    const handleRetryWithAssistant = (assistantId: string) => {
        onRetryWithAssistant(assistantId);
        setIsOpen(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const floatingElement = refs.floating.current as HTMLElement;
            const referenceElement = refs.reference.current as HTMLElement;
            
            if (floatingElement && !floatingElement.contains(event.target as Node) &&
                referenceElement && !referenceElement.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, refs.floating, refs.reference]);

    // Filter out the current assistant from the list
    const availableAssistants = assistants.filter(assistant => assistant.id !== currentAssistantId);

    return (
        <div className={`relative ${className}`}>
            {/* Trigger button */}
            <button
                ref={refs.setReference}
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsOpen(!isOpen);
                    }
                }}
                className="text-gray-300 pl-4 pr-4 py-2 text-sm cursor-pointer transition-all duration-200 flex items-center gap-2 focus:outline-none focus:ring-0 active:outline-none hover:bg-[rgb(20,21,18)] hover:rounded-md"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span style={{ fontFamily: 'Styrene-B' }}>Retry</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown menu */}
            {isOpen && (
                <div
                    ref={refs.setFloating}
                    style={{
                        ...floatingStyles,
                        backgroundColor: '#30302E',
                        width: '312px'
                    }}
                    className="z-50 border border-gray-600 rounded-lg shadow-lg backdrop-blur-sm"
                >
                    <div className="py-2">
                        {/* Assistant options */}
                        {availableAssistants.map((assistant) => (
                            <div key={assistant.id} className="px-4 py-3 transition-all duration-200">
                                <button
                                    onClick={() => handleRetryWithAssistant(assistant.id)}
                                    className="w-full text-left flex items-center justify-between"
                                >
                                    <div className="flex-1">
                                        <div className="text-white font-medium text-sm" style={{ fontFamily: 'Styrene-B' }}>
                                            {assistant.name}
                                        </div>
                                        <div className="text-gray-400 text-xs mt-1" style={{ fontFamily: 'Styrene-B' }}>
                                            {assistant.subtitle || 'Smart, efficient model for everyday use'}
                                        </div>
                                    </div>
                                </button>
                            </div>
                        ))}
                        
                        {availableAssistants.length === 0 && (
                            <div className="px-4 py-3 text-gray-400 text-sm">
                                No other assistants available
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RetryAssistantSelector; 