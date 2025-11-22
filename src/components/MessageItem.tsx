import React, {useEffect, useMemo, useRef, useState} from 'react';
import TelegramStyleVoiceMessage from './TelegramStyleVoiceMessage';
import {ChatHistory} from "../types/model/ChatHistory";
import {Assistant} from "../types/model/Assistant";
import {base64ToUint8Array} from "../utils/Base64Converter";
import {ArticleParser} from "../utils/ArticleParser";
import {getDurationFromBase64} from "../utils/audioUtils";
import codeIcon from '../assets/icons/code.svg';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageItemProps {
    message: ChatHistory;
    index: number;
    userAvatar: React.ReactNode;
    assistantAvatar: React.ReactNode;
    assistant?: Assistant;
    onToggleArtifacts?: (artifact: ChatHistory) => void;
    onOpenRightSidebar?: (artifact?: ChatHistory) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({
                                                     message,
                                                     index,
                                                     userAvatar,
                                                     assistantAvatar,
                                                     assistant,
                                                     onToggleArtifacts,
                                                     onOpenRightSidebar
                                                 }) => {
    const isAudio = message.audioFileName && /\.(webm|mpeg|mp3|wav|ogg|m4a)$/i.test(message.audioFileName);
    const hasAudioData: boolean = !!(isAudio && message.audioData && message.audioData);
    const hasImageData: boolean = !!(message.files && message.files.some(file => file.isImage && file.fileData));
    const hasVideoData = !!(
        message.files &&
        message.files.some(file => file.isVideo && file.fileData)
    );

    const hasMultiImages: boolean = !!(message.is_multi_response && message.files && message.files.some(file => file.isImage));
    const hasArticle: boolean = !!(message.isArticle && message.article_text);


    const audioRef = useRef<HTMLAudioElement>(null);
    const [audioDuration, setAudioDuration] = useState<number>(0);

    // Функция для извлечения кода из текста сообщения
    const extractCodeFromText = (text: string): string | null => {
        // Ищем код в тройных кавычках (```)
        const codeBlockRegex = /```(?:(\w+)\n)?([\s\S]*?)```/;
        const match = text.match(codeBlockRegex);
        if (match) {
            return match[2].trim();
        }

        // Ищем код в одинарных кавычках (''')
        const singleQuoteRegex = /'''([\s\S]*?)'''/;
        const singleMatch = text.match(singleQuoteRegex);
        if (singleMatch) {
            return singleMatch[1].trim();
        }

        return null;
    };

    // Function to dynamically extract title and determine content type
    const getContentInfo = () => {
        let title = "Generated Content";
        let type = "Content";

        // Extract title from artifact code if available
        if (message.isCode && message.artifact_code) {
            // First, try to find the actual chart title from the code
            const lines = message.artifact_code.split('\n');

            // Look for the main chart title first (usually at the beginning)
            for (const line of lines) {
                const trimmedLine = line.trim();
                // Look for title in variable assignments (this is usually the main title)
                if (trimmedLine.includes('title') || trimmedLine.includes('Title')) {
                    const match = trimmedLine.match(/title\s*[:=]\s*["']([^"']+)["']/i);
                    if (match) {
                        title = match[1];
                        break;
                    }
                }
            }

            // If no title found in variables, look for markdown headers (but skip comments)
            if (title === "Generated Content") {
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    // Only look for markdown headers, not code comments
                    if (trimmedLine.startsWith('#') && !trimmedLine.startsWith('//') && !trimmedLine.startsWith('/*')) {
                        const extractedTitle = trimmedLine.replace(/^#+\s*/, '').trim();
                        if (extractedTitle && extractedTitle.length > 0) {
                            title = extractedTitle;
                            break;
                        }
                    }
                }
            }

            // Determine type based on content
            if (message.artifact_code.includes('chart') || message.artifact_code.includes('graph') ||
                message.artifact_code.includes('Q1') || message.artifact_code.includes('Q2') ||
                message.artifact_code.includes('Q3') || message.artifact_code.includes('Q4')) {
                type = 'Chart';
            } else if (message.artifact_code.includes('performance') || message.artifact_code.includes('revenue') ||
                message.artifact_code.includes('orders')) {
                type = 'Report';
            } else {
                type = 'Code';
            }
        } else if (hasImageData) {
            const imageFile = message.files?.find(file => file.isImage);
            title = imageFile?.fileName || "Generated Image";
            type = "Image";
        } else if (hasMultiImages) {
            title = `Generated Images (${multiImageUrls.length})`;
            type = "Images";
        } else if (hasVideoData) {
            const videoFiles = message.files?.filter(file =>
                file.fileMimeType && file.fileMimeType.startsWith('video/')
            );
            // Для сообщений от пользователя используем "Attached Video", для ассистента - "Generated Content"
            title = message.sender === 'user' ? "Attached Video" : "Generated Content";
            type = "Video";
        } else if (hasAudioData) {
            title = message.audioFileName || "Generated Audio";
            type = "Audio";
        } else if (hasArticle && message.article_text) {
            // Extract title from article
            title = ArticleParser.extractArticleTitle(message.article_text);
            type = "Article";
        } else if (message.text) {
            // Try to extract title from message text
            const lines = message.text.split('\n');
            for (const line of lines) {
                const trimmedLine = line.trim();
                // Look for markdown headers
                if (trimmedLine.startsWith('#') && trimmedLine.length > 1) {
                    const extractedTitle = trimmedLine.replace(/^#+\s*/, '').trim();
                    if (extractedTitle && extractedTitle.length > 0) {
                        title = extractedTitle;
                        break;
                    }
                }
                // Look for common title patterns
                if (trimmedLine.includes('Title:') || trimmedLine.includes('title:')) {
                    const match = trimmedLine.match(/title:\s*(.+)/i);
                    if (match) {
                        title = match[1].trim();
                        break;
                    }
                }
            }

            // Determine type based on content
            if (message.text.includes("chart") || message.text.includes("graph")) {
                type = "Chart";
            } else if (message.text.includes("document") || message.text.includes("Document")) {
                type = "Document";
            } else if (message.text.includes("performance") || message.text.includes("report")) {
                type = "Report";
            }
        }

        return {title, type};
    };

    const contentInfo = getContentInfo();


    // Create audio URL from base64 if available
    const audioUrl = useMemo(() => {
        if (hasAudioData) {
            try {
                const blob = new Blob([base64ToUint8Array(message.audioData)], {
                    type: message.audioMimeType || 'audio/webm'
                });
                return URL.createObjectURL(blob);
            } catch (error) {
                console.error('Failed to create audio blob:', error);
                return null;
            }
        }
        return null;
    }, [message.id, message.audioData, message.audioMimeType, hasAudioData]);

    // Calculate audio duration when audio URL is available
    useEffect(() => {
        if (audioUrl && hasAudioData) {
            const audio = new Audio();

            const handleLoadedMetadata = () => {
                if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
                    setAudioDuration(audio.duration);
                }
            };

            const handleLoadedData = () => {
                if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
                    setAudioDuration(audio.duration);
                }
            };

            const handleCanPlay = () => {
                if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
                    setAudioDuration(audio.duration);
                }
            };

            const handleError = (e: Event) => {
                console.warn(`❌ Audio failed to load for message ${message.id}:`, e);
                setAudioDuration(0);
            };

            // Set a timeout to handle cases where metadata doesn't load
            const metadataTimeout = setTimeout(() => {
                if (audioDuration === 0) {
                    audio.load();
                }
            }, 1000);

            audio.addEventListener('loadedmetadata', handleLoadedMetadata);
            audio.addEventListener('loadeddata', handleLoadedData);
            audio.addEventListener('canplay', handleCanPlay);
            audio.addEventListener('error', handleError);

            // Set the source and load the audio
            audio.src = audioUrl;
            audio.preload = 'metadata';
            audio.load();

            return () => {
                clearTimeout(metadataTimeout);
                audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
                audio.removeEventListener('loadeddata', handleLoadedData);
                audio.removeEventListener('canplay', handleCanPlay);
                audio.removeEventListener('error', handleError);
            };
        }
    }, [audioUrl, hasAudioData]);

    // Extract duration from Base64 if not available in message
    useEffect(() => {
        if (hasAudioData && message.audioData && audioDuration === 0) {
            // Extract duration from Base64 using Web Audio API
            getDurationFromBase64(message.audioData, message.audioMimeType || 'audio/webm')
                .then(duration => {
                    if (duration > 0) {
                        setAudioDuration(duration);
                    }
                })
                .catch(error => {
                    console.error(`❌ Web Audio API failed for message ${message.id}:`, error);
                });
        }
    }, [hasAudioData, message.audioData, message.audioMimeType, audioDuration]);

    const imageUrl = useMemo(() => {
        if (hasImageData) {
            try {
                const imageFile = message.files?.find(file => file.isImage && file.fileData);
                if (imageFile) {
                    return `data:image/${imageFile.fileMimeType || 'png'};base64,${imageFile.fileData}`;
                }
            } catch (error) {
                console.error('Failed to create image data URL:', error);
                return null;
            }
        }
        return null;
    }, [message.id, message.files, hasImageData]);

    // Create multiple image URLs from files array
    const multiImageUrls = useMemo(() => {
        if (hasMultiImages && message.files) {
            try {
                return message.files
                    .filter(file => file.isImage)
                    .map((file, index) => ({
                        key: `${file.fileName}-${index}`,
                        url: `data:${file.fileMimeType || 'image/png'};base64,${file.fileData}`,
                        fileName: file.fileName
                    }));
            } catch (error) {
                console.error('Failed to create multi-image URLs:', error);
                return [];
            }
        }
        return [];
    }, [message.id, message.files, hasMultiImages]);

    // Cleanup blob URLs when component unmounts or URLs change
    useEffect(() => {
        return () => {
            if (audioUrl && audioUrl.startsWith('blob:')) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, [audioUrl, imageUrl]);

    // Handle audio loading events
    useEffect(() => {
        if (hasAudioData && audioRef.current && audioUrl) {
            const audio = audioRef.current;

            const handleLoadStart = () => {
                // Audio loading started
            };

            const handleCanPlay = () => {
                // Audio can play
            };

            const handleError = (e: Event) => {
                console.error('Audio failed to load', e);
            };

            audio.addEventListener('loadstart', handleLoadStart);
            audio.addEventListener('canplay', handleCanPlay);
            audio.addEventListener('error', handleError);

            return () => {
                audio.removeEventListener('loadstart', handleLoadStart);
                audio.removeEventListener('canplay', handleCanPlay);
                audio.removeEventListener('error', handleError);
            };
        }
    }, [audioUrl]);


    // Function to render text with Markdown support and clickable sections
    const renderTextWithMarkdown = (text: string) => {
        // More flexible regex to match variations of "Sales performance"
        const salesPerformanceRegex = /(Sales performance|Channel Performance|Performance metrics)/gi;
        
        // Check if text contains Markdown patterns or bullet points
        const hasMarkdown = /[*_`#\[\]()>|~-]/.test(text);
        const hasBulletPoints = /^[•\-\*]\s/m.test(text);
        const hasNumberedList = /^\d+\.\s/m.test(text);
        const hasSalesPerformance = salesPerformanceRegex.test(text);
        
        // Convert bullet points to proper Markdown format
        let processedText = text;
        if (hasBulletPoints) {
            // Convert bullet points to proper Markdown list format
            processedText = text
                .replace(/^[•\-\*]\s/gm, '- ') // Convert bullet points to markdown list items
                .replace(/\n\n/g, '\n') // Remove extra line breaks
                .replace(/([^\n])\n([^\n])/g, '$1\n\n$2') // Add proper spacing between sections
                .replace(/([^\n])\n(- [^\n]+)/g, '$1\n\n$2'); // Add spacing before list items
        }
        
        if (hasNumberedList) {
            // Convert numbered lists to proper Markdown format
            processedText = text
                .replace(/^\d+\.\s/gm, (match) => {
                    const number = match.replace(/\.\s/, '');
                    return `${number}. `;
                })
                .replace(/\n\n/g, '\n') // Remove extra line breaks
                .replace(/([^\n])\n([^\n])/g, '$1\n\n$2') // Add proper spacing between sections
                .replace(/([^\n])\n(\d+\.\s[^\n]+)/g, '$1\n\n$2'); // Add spacing before list items
        }
        
        // Convert plain text headers to Markdown headers
        processedText = processedText.replace(/^([A-Z][A-Za-z\s]+)$/gm, (match, header) => {
            // Skip if it's already a list item or contains special characters
            if (match.startsWith('- ') || /[•\-\*]/.test(match) || /[^\w\s]/.test(match)) {
                return match;
            }
            // Convert to h2 header
            return `## ${header}`;
        });
        
        if (hasMarkdown || hasBulletPoints || hasNumberedList) {
            // Use ReactMarkdown for Markdown rendering
            return (
                <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                        // Custom styling for Markdown elements
                        h1: ({children}) => <h1 className="text-xl font-bold mb-4 text-white">{children}</h1>,
                        h2: ({children}) => <h2 className="text-lg font-bold mb-3 text-white">{children}</h2>,
                        h3: ({children}) => <h3 className="text-base font-bold mb-2 text-white">{children}</h3>,
                        p: ({children}) => <p className="mb-3 leading-relaxed">{children}</p>,
                        strong: ({children}) => <strong className="font-bold">{children}</strong>,
                        em: ({children}) => <em className="italic">{children}</em>,
                        code: ({children, className}) => (
                            <code className={`bg-gray-800 px-1 py-0.5 rounded text-sm ${className || ''}`}>
                                {children}
                            </code>
                        ),
                        pre: ({children}) => (
                            <pre className="bg-gray-800 p-3 rounded-lg overflow-x-auto mb-3">
                                {children}
                            </pre>
                        ),
                        ul: ({children}) => (
                            <ul className="list-disc mb-4 space-y-2" style={{ paddingLeft: '1.5rem', listStylePosition: 'outside' }}>
                                {children}
                            </ul>
                        ),
                        ol: ({children}) => (
                            <ol className="list-decimal mb-4 space-y-2" style={{ paddingLeft: '1.5rem', listStylePosition: 'outside' }}>
                                {children}
                            </ol>
                        ),
                        li: ({children}) => (
                            <li className="mb-2 leading-relaxed" style={{ paddingLeft: '0.5rem' }}>
                                {children}
                            </li>
                        ),
                        blockquote: ({children}) => (
                            <blockquote className="border-l-4 border-gray-600 pl-4 italic mb-3">
                                {children}
                            </blockquote>
                        ),
                        a: ({children, href}) => (
                            <a 
                                href={href} 
                                className="text-blue-400 hover:text-blue-300 underline"
                                target="_blank" 
                                rel="noopener noreferrer"
                            >
                                {children}
                            </a>
                        ),
                    }}
                >
                    {processedText}
                </ReactMarkdown>
            );
        } else if (hasSalesPerformance) {
            // Handle clickable sections for non-Markdown text
            const parts = text.split(salesPerformanceRegex);
            return parts.map((part, index) => {
                if (salesPerformanceRegex.test(part)) {
                    return (
                        <span
                            key={index}
                            className="cursor-pointer text-blue-400 hover:text-blue-300 underline transition-colors duration-200 inline-flex items-center gap-1"
                            onClick={() => onOpenRightSidebar()}
                            title="Click to view Channel Performance"
                        >
                            {part}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                            </svg>
                        </span>
                    );
                }
                return part;
            });
        } else {
            // Plain text with proper line breaks
            return text.split('\n').map((line, index) => (
                <React.Fragment key={index}>
                    {line}
                    {index < text.split('\n').length - 1 && <br />}
                </React.Fragment>
            ));
        }
    };

    // Check message status for visual feedback
    const isQueued = message.status === 'queued';
    const isSending = message.status === 'sending';
    const isFailed = message.status === 'failed';
    const hasStatus = isQueued || isSending || isFailed;

    return (
        <div
            className={`text-white font-medium w-full break-words flex flex-col ${message.sender === 'user' ? 'items-center' : 'items-start text-left'}`}
            style={{
                fontSize: '16px',
                opacity: isQueued ? 0.5 : 1, // Grayed out for queued messages
                transition: 'opacity 0.2s ease'
            }}>
            {message.text && (
                <div
                    className={`${hasImageData || hasAudioData || hasVideoData || hasMultiImages ? 'mb-2' : ''} w-full max-w-4xl`}
                    style={{
                        fontFamily: 'inherit',
                        lineHeight: '26px',
                        fontStyle: isQueued ? 'italic' : 'normal' // Italic for queued messages
                    }}>
                    {renderTextWithMarkdown(message.text)}

                    {/* Status indicator for user messages */}
                    {message.sender === 'user' && hasStatus && (
                        <span style={{
                            display: 'inline-block',
                            marginLeft: '8px',
                            fontSize: '11px',
                            color: isQueued ? 'rgb(156, 163, 175)' : isSending ? 'rgb(96, 165, 250)' : 'rgb(239, 68, 68)',
                            fontStyle: 'normal',
                            fontWeight: '400',
                            verticalAlign: 'bottom'
                        }}>
                            {isQueued && '(queued)'}
                            {isSending && '(sending...)'}
                            {isFailed && '(failed)'}
                        </span>
                    )}
                </div>
            )}

            {hasAudioData && audioUrl && (
                <TelegramStyleVoiceMessage
                    src={audioUrl}
                    duration={audioDuration > 0 ? audioDuration : undefined}
                    isAssistantMessage={message.sender === 'assistant'}
                />
            )}

            {(hasImageData || hasMultiImages) && onToggleArtifacts && (
                <div
                    className="cursor-pointer rounded-lg transition-all duration-200 ease-in-out flex flex-col gap-1 mt-2 w-full hover:bg-gray-700/20"
                    style={{
                        backgroundColor: 'var(--color-dark-bg) !important',
                        border: '1px solid var(--color-white-4-10) !important',
                        borderRadius: '8px !important',
                        paddingTop: '16px',
                        paddingBottom: '16px',
                        paddingLeft: '16px',
                        paddingRight: '16px'
                    }}
                    onClick={() => onToggleArtifacts(message)}
                    title="Click to view artifact"
                >
                    <span style={{
                        lineHeight: '1.25',
                        fontSize: '14px',
                        fontWeight: '400',
                        color: 'rgb(192, 191, 187)'
                    }}>
                        Interactive artifact{hasMultiImages ? ` (${multiImageUrls.length} images)` : ''}
                    </span>
                </div>
            )}



            {hasVideoData && onToggleArtifacts && (
                <div
                    className="cursor-pointer rounded-lg transition-all duration-200 ease-in-out flex flex-col gap-1 mt-2 w-full hover:bg-gray-700/20"
                    style={{
                        backgroundColor: 'var(--color-dark-bg) !important',
                        border: '1px solid var(--color-white-4-10) !important',
                        borderRadius: '8px !important',
                        paddingTop: '16px',
                        paddingBottom: '16px',
                        paddingLeft: '16px',
                        paddingRight: '16px'
                    }}
                    onClick={() => onToggleArtifacts(message)}
                    title="Click to view video artifact"
                >
                    <div className="flex flex-col" style={{gap: '4px'}}>
                        <span style={{
                            lineHeight: '1.25',
                            fontSize: '14px',
                            fontWeight: '400',
                            color: 'white',
                            fontFamily: 'Styrene-B'
                        }}>
                            {contentInfo.title}
                        </span>
                        <span style={{
                            lineHeight: '1.25',
                            fontSize: '14px',
                            color: 'rgb(192, 191, 187)',
                            fontFamily: 'Styrene-B'
                        }}>
                            {contentInfo.type}
                        </span>
                    </div>
                </div>
            )}

            {/* Показываем кнопку кода только если это не статья */}
            {!hasArticle && (message.isCode && message.artifact_code) ? (
                <div
                    className="cursor-pointer rounded-lg transition-all duration-200 ease-in-out flex flex-col gap-1 mt-2 w-full hover:bg-gray-700/20"
                    style={{
                        backgroundColor: 'var(--color-dark-bg) !important',
                        border: '1px solid var(--color-white-4-10) !important',
                        borderRadius: '8px !important',
                        paddingTop: '16px',
                        paddingBottom: '16px',
                        paddingLeft: '16px',
                        paddingRight: '16px'
                    }}
                    onClick={() => onOpenRightSidebar(message)}
                    title="Click to view code"
                >
                    <div className="flex flex-col" style={{gap: '4px'}}>
                        <span style={{
                            lineHeight: '1.25',
                            fontSize: '14px',
                            fontWeight: '400',
                            color: 'white',
                            fontFamily: 'Styrene-B'
                        }}>
                            {contentInfo.title}
                        </span>
                        <span style={{
                            lineHeight: '1.25',
                            fontSize: '14px',
                            color: 'rgb(192, 191, 187)',
                            fontFamily: 'Styrene-B'
                        }}>
                            {contentInfo.type}
                        </span>
                    </div>
                </div>
            ) : null}

            {/* Показываем кнопку статьи */}
            {hasArticle && onOpenRightSidebar && (
                <div
                    className="cursor-pointer rounded-lg transition-all duration-200 ease-in-out flex flex-col gap-1 mt-2 w-full hover:bg-gray-700/20"
                    style={{
                        backgroundColor: 'var(--color-dark-bg) !important',
                        border: '1px solid var(--color-white-4-10) !important',
                        borderRadius: '8px !important',
                        paddingTop: '16px',
                        paddingBottom: '16px',
                        paddingLeft: '16px',
                        paddingRight: '16px'
                    }}
                    onClick={() => onOpenRightSidebar(message)}
                    title="Click to view article"
                >
                    <div className="flex flex-col" style={{gap: '4px'}}>
                        <span style={{
                            lineHeight: '1.25',
                            fontSize: '14px',
                            fontWeight: '400',
                            color: 'white',
                            fontFamily: 'Styrene-B'
                        }}>
                            {contentInfo.title}
                        </span>
                        <span style={{
                            lineHeight: '1.25',
                            fontSize: '14px',
                            color: 'rgb(192, 191, 187)',
                            fontFamily: 'Styrene-B'
                        }}>
                            {contentInfo.type}
                        </span>
                    </div>
                </div>
            )}

            {message.files && message.files.length > 0 && !hasImageData && !hasAudioData && !hasVideoData && !hasMultiImages && (
                <span className="text-xs text-gray-400">📎 {message.files[0].fileName}</span>
            )}

            {/* {message.sender === 'assistant' && (
                <span className="text-xs text-gray-400 mt-1.5 ml-1 font-normal">
                    {assistant?.name || assistant?.id || 'Assistant'}
                </span>
            )} */}
        </div>
    );
};

export default MessageItem; 