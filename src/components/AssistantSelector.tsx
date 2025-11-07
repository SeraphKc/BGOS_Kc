import React, { useState, useRef, useEffect } from 'react';
import { useFloating, offset, flip, shift } from '@floating-ui/react';
import arrowDownIcon from '../assets/icons/arrow-down.svg';
import checkIcon from '../assets/icons/check.svg';
import {Assistant} from "../types/model/Assistant";

interface AssistantSelectorProps {
    assistants: Assistant[];
    selectedAssistant?: Assistant | null;
    forceSelectAssistant: (assistantId: string) => void;
    className?: string;
    disabled?: boolean;
}

const AssistantSelector: React.FC<AssistantSelectorProps> = ({
    assistants,
    selectedAssistant,
    className = '',
    disabled = false,
    forceSelectAssistant
}) => {
    const [isOpen, setIsOpen] = useState(false);

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

    const handleSelectAssistant = (assistantId: string) => {
        forceSelectAssistant(assistantId);
        setIsOpen(false);
    };

    const handleMoreModels = () => {
        // TODO: Implement more models functionality
        console.log('More models clicked');
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

    return (
        <div className={`relative ${className}`}>
            {/* Trigger button */}
            <button
                ref={refs.setReference}
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!disabled) {
                        setIsOpen(!isOpen);
                    }
                }}
                onKeyDown={(e) => {
                    if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }
                }}
                disabled={disabled}
                className={`flex items-center gap-2 bg-transparent text-white border-none font-semibold text-sm transition-colors duration-200 px-2 py-1 rounded ${
                    disabled 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-background-light cursor-pointer'
                }`}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className="text-ellipsis overflow-hidden whitespace-nowrap" style={{ fontFamily: 'Styrene-B' }}>
                    {disabled ? 'Loading...' : (selectedAssistant?.name || 'Select Assistant')}
                </span>
                <img 
                    src={arrowDownIcon} 
                    alt="Dropdown" 
                    className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
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
                        {assistants.map((assistant) => (
                            <div key={assistant.id} className="px-4 py-3 transition-all duration-200">
                                <button
                                    onClick={() => handleSelectAssistant(assistant.id)}
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
                                    {selectedAssistant?.id === assistant.id && (
                                        <img 
                                            src={checkIcon} 
                                            alt="Selected" 
                                            className="w-4 h-4 ml-2 filter brightness-0 invert"
                                        />
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssistantSelector; 