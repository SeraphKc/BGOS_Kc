import React, { useRef, useEffect, useState } from 'react';
import MessageItem from './MessageItem';
import {Assistant} from "../types/model/Assistant";
import {ChatHistory} from "../types/model/ChatHistory";
import type { InlineKeyboardButton, InlineInputState } from '@bgos/shared-types';
import copyIcon from '../assets/icons/copy.svg';
import RetryAssistantSelector from './RetryAssistantSelector';
import BDOSIcon from './icons/BDOSIcon';
import { LoadingIndicator } from './LoadingIndicator';
import { useAppSelector } from '../utils/hooks';
import { getInitials, getAvatarColor } from '../utils/avatarUtils';
import AnimatedCheckmark from './AnimatedCheckmark';

interface ChatMessagesProps {
    messages?: ChatHistory[];
    assistant?: Assistant;
    assistants?: Assistant[];
    isLoading?: boolean;
    onToggleArtifacts?: (artifact: ChatHistory) => void;
    onOpenRightSidebar?: (artifact?: ChatHistory) => void;
    onRetryWithAssistant?: (assistantId: string) => void;
    // Inline keyboard props (optional - only passed when keyboard support is enabled)
    loadingButtonId?: string | null;
    inlineInputState?: InlineInputState | null;
    onCallbackClick?: (callbackData: string, buttonId: string, messageId: string, originalText: string) => void;
    onUrlClick?: (url: string) => void;
    onCopyClick?: (text: string) => void;
    onInputSubmit?: (value: string) => void;
    onInputCancel?: () => void;
    onInputChange?: (value: string) => void;
    onInputOpen?: (button: InlineKeyboardButton, messageId: string) => void;
}


const ChatMessages: React.FC<ChatMessagesProps> = ({
    messages,
    assistant,
    assistants = [],
    isLoading = false,
    onToggleArtifacts,
    onOpenRightSidebar,
    onRetryWithAssistant,
    // Inline keyboard props
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
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Get current user for initials
    const currentUser = useAppSelector((state) => state.user.currentUser);

    // Track which message was copied for showing checkmark animation
    const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleCopyMessage = async (text: string, messageIndex: number) => {
        try {
            // Copy the text in its original format (preserving markdown/HTML)
            await navigator.clipboard.writeText(text);

            // Show checkmark animation
            setCopiedMessageIndex(messageIndex);

            // Reset back to copy icon after 1 second
            setTimeout(() => {
                setCopiedMessageIndex(null);
            }, 1000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);

            // Show checkmark animation even with fallback
            setCopiedMessageIndex(messageIndex);
            setTimeout(() => {
                setCopiedMessageIndex(null);
            }, 1000);
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Filter out the first message if it's from the assistant and contains "Ava assistant"
    const filteredMessages = messages ? messages.filter((message, index) => {
        if (index === 0 && message.sender === 'assistant' && message.text.includes('Ava assistant')) {
            return false; // Do not render this message
        }
        return true; // Render all other messages
    }) : [];

    // Generate user avatar with initials from current user's name
    const userName = currentUser?.name || '';
    const userInitials = userName ? getInitials(userName) : 'U';
    const userColor = userName ? getAvatarColor(userName) : 'rgb(193, 193, 182)';

    const userAvatar = (
        <div className="rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{
            backgroundColor: userColor,
            color: '#ffffff',
            width: '28px',
            height: '28px',
            fontFamily: 'Montserrat'
        }}>
            {userInitials}
        </div>
    );

    const assistantAvatar = (
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold text-gray-900 flex-shrink-0" style={{ backgroundColor: '#212121' }}>
            {assistant?.name.charAt(0) || 'A'}
        </div>
    );

    return (
        <div className="w-full my-scrollbar flex-1 overflow-y-auto pb-8 flex flex-col gap-6 scroll-smooth" style={{ marginTop: '67px' }}>
            <div className="w-full max-w-4xl mx-auto px-4" style={{ width: '100%' }}>
                {filteredMessages && filteredMessages.length > 0 && filteredMessages.map((message, index) => (
                    <div
                        key={index}
                        className="flex justify-start w-full mb-6"
                    >
                        {message.sender === 'user' ? (
                            // User message with avatar and background
                            <div className="flex flex-col gap-2 w-full group">
                                <div className="flex items-start gap-3 px-4 py-3" style={{ backgroundColor: 'rgb(15, 16, 13)', borderRadius: '8px', maxWidth: 'fit-content' }}>
                                    {userAvatar}
                                    <div>
                                        <MessageItem
                                            message={message}
                                            index={index}
                                            userAvatar={userAvatar}
                                            assistantAvatar={assistantAvatar}
                                            assistant={assistant}
                                            onToggleArtifacts={onToggleArtifacts}
                                            onOpenRightSidebar={onOpenRightSidebar}
                                            loadingButtonId={loadingButtonId}
                                            inlineInputState={inlineInputState}
                                            onCallbackClick={onCallbackClick ? (data, btnId) => onCallbackClick(data, btnId, message.id || '', message.text || '') : undefined}
                                            onUrlClick={onUrlClick}
                                            onCopyClick={onCopyClick}
                                            onInputSubmit={onInputSubmit}
                                            onInputCancel={onInputCancel}
                                            onInputChange={onInputChange}
                                            onInputOpen={onInputOpen ? (btn) => onInputOpen(btn, message.id || '') : undefined}
                                        />
                                    </div>
                                </div>
                                {/* Copy button for user messages - only visible on hover, aligned right */}
                                <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <button
                                        onClick={() => handleCopyMessage(message.text, index)}
                                        className="p-2 hover:bg-gray-700/20 rounded-lg transition-all duration-200 focus:outline-none"
                                        title={copiedMessageIndex === index ? "Copied!" : "Copy message"}
                                    >
                                        {copiedMessageIndex === index ? (
                                            <AnimatedCheckmark size={16} />
                                        ) : (
                                            <img
                                                src={copyIcon}
                                                alt="Copy"
                                                className="w-5 h-5 object-contain"
                                            />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Assistant message with transparent background and no avatar
                            <div className="flex-1" style={{ backgroundColor: 'transparent', borderRadius: '8px' }}>
                                <div className="w-full">
                                    <MessageItem
                                        message={message}
                                        index={index}
                                        userAvatar={userAvatar}
                                        assistantAvatar={assistantAvatar}
                                        assistant={assistant}
                                        onToggleArtifacts={onToggleArtifacts}
                                        onOpenRightSidebar={onOpenRightSidebar}
                                        loadingButtonId={loadingButtonId}
                                        inlineInputState={inlineInputState}
                                        onCallbackClick={onCallbackClick ? (data, btnId) => onCallbackClick(data, btnId, message.id || '', message.text || '') : undefined}
                                        onUrlClick={onUrlClick}
                                        onCopyClick={onCopyClick}
                                        onInputSubmit={onInputSubmit}
                                        onInputCancel={onInputCancel}
                                        onInputChange={onInputChange}
                                        onInputOpen={onInputOpen ? (btn) => onInputOpen(btn, message.id || '') : undefined}
                                    />

                                    {/* BDOS Icon and Controls Footer - for all assistant messages */}
                                    <div className={`flex flex-col gap-2 mt-4 w-full group ${index === filteredMessages.length - 1 ? '' : 'hover:opacity-100 opacity-0 transition-opacity duration-200'}`}>
                                        <div className="flex justify-between items-center w-full">
                                            {/* BDOS Icon on the left - only show on last message */}
                                            <div className="flex items-center">
                                                {index === filteredMessages.length - 1 && (
                                                    <BDOSIcon size={32} />
                                                )}
                                            </div>
                                            
                                            {/* Copy and Retry controls on the right */}
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleCopyMessage(message.text, index)}
                                                    className="p-2 hover:bg-gray-700/20 rounded-lg transition-all duration-200 focus:outline-none"
                                                    title={copiedMessageIndex === index ? "Copied!" : "Copy message"}
                                                >
                                                    {copiedMessageIndex === index ? (
                                                        <AnimatedCheckmark size={16} />
                                                    ) : (
                                                        <img
                                                            src={copyIcon}
                                                            alt="Copy"
                                                            className="w-5 h-5 object-contain"
                                                        />
                                                    )}
                                                </button>
                                                {assistants.length > 1 && onRetryWithAssistant && (
                                                    <RetryAssistantSelector
                                                        assistants={assistants}
                                                        currentAssistantId={assistant?.id || ''}
                                                        onRetryWithAssistant={onRetryWithAssistant}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Disclaimer text - only for the last message */}
                                        {index === filteredMessages.length - 1 && (
                                            <div className="flex items-center justify-end w-full">
                                                <div className="flex items-center gap-2">
                                                    <span 
                                                        className="text-sm hover:underline cursor-pointer transition-all duration-200" 
                                                        style={{ 
                                                            fontFamily: 'Styrene-B',
                                                            color: 'rgba(255, 255, 255, 0.4)'
                                                        }}
                                                    >
                                                        {assistant?.name || 'Ava'} can make mistakes. Please double-check responses.
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                
                {/* Loading indicator */}
                {isLoading && (
                    <div className="flex justify-start w-full mb-6">
                        <div className="flex-1 p-4" style={{ backgroundColor: 'transparent', borderRadius: '8px' }}>
                            <div className="w-full">
                                <div className="flex flex-col gap-4 w-full">
                                    {/* Controls on first line */}
                                    <div className="flex justify-between items-center w-full">
                                        {/* Empty space on left to align with controls */}
                                        <div></div>

                                        {/* Controls for loading state */}
                                        <div className="flex items-center gap-3">
                                            <button
                                                className="p-2 hover:bg-gray-700/20 rounded-lg transition-colors duration-200 focus:outline-none opacity-50 cursor-not-allowed"
                                                title="Copy message (not available while loading)"
                                                disabled
                                            >
                                                <img
                                                    src={copyIcon}
                                                    alt="Copy"
                                                    className="w-5 h-5 object-contain"
                                                />
                                            </button>
                                            {assistants.length > 1 && onRetryWithAssistant && (
                                                <RetryAssistantSelector
                                                    assistants={assistants}
                                                    currentAssistantId={assistant?.id || ''}
                                                    onRetryWithAssistant={onRetryWithAssistant}
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Loading indicator on new line where response will appear */}
                                    <div className="w-full">
                                        <LoadingIndicator visible={true} />
                                    </div>

                                    {/* Disclaimer text for loading state */}
                                    <div className="flex items-center justify-end w-full">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="text-sm"
                                                style={{
                                                    fontFamily: 'Styrene-B',
                                                    color: 'rgba(255, 255, 255, 0.4)'
                                                }}
                                            >
                                                {assistant?.name || 'Ava'} can make mistakes. Please double-check responses.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div ref={messagesEndRef} />
        </div>
    );
};

export default ChatMessages; 