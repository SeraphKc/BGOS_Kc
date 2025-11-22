import React, {useEffect, useRef, useState} from 'react';
import {useWebhook} from "../hooks/useWebhoock";
import {useChatQueue} from "../hooks/useChatQueue";
import ChatInput from '../components/ChatInput';
import ChatMessages from './ChatMessages';

import ArtifactSidebar from './ArtifactSidebar';
import {ConversationPage} from './voiceAgent/ConversationPage';
import {TranscriptLoader} from './voiceAgent/TranscriptLoader';
import {AnimatePresence} from 'framer-motion';
import {Assistant} from "../types/model/Assistant";
import {Chat} from "../types/model/Chat";
import {ChatHistory, FileInfo} from "../types/model/ChatHistory";
import codeIcon from '../assets/icons/code.svg';
import graphIcon from '../assets/icons/graph.svg';
import directboxIcon from '../assets/icons/directbox.svg';
import documentIcon from '../assets/icons/document-text.svg';
import briefcaseIcon from '../assets/icons/briefcase.svg';
import {useAppDispatch, useAppSelector} from '../utils/hooks';
import {selectShowRightSidebar, selectSidebarCollapsed} from '../utils/selectors';
import {setShowRightSidebar, setSidebarCollapsed} from '../slices/UISlice';
import LoadingSpinner from './LoadingSpinner';
import {useNotification} from '../hooks/useNotification';
import {AssistantAndChatDto} from "../types/n8n/AssistantsWithChatsDto";


interface ChatAreaProps {
    currentAssistant?: Assistant;
    currentChat: Chat | null;
    chatHistory?: ChatHistory[];
    onChatMessage: (msg: ChatHistory) => Promise<ChatHistory>;
    updateChatHistory: (newMessage: ChatHistory, isNewChat?: boolean) => void;
    updateChatHistoryLocal: (newMessage: ChatHistory) => void;
    onSelectAssistant: (assistantId: string, skipChatLoading?: boolean) => void;
    handleNewChat: (chatFirstMessage: string) => Promise<AssistantAndChatDto>;
    assistants: Assistant[];
    userId: string;
    isLoading: boolean;
    isLoadingAssistants?: boolean;
    resetUserInteractedRef?: React.MutableRefObject<boolean>;
    forceSelectAssistant: (assistantId: string) => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({
    currentAssistant,
    currentChat,
    chatHistory = [],
    onChatMessage,
    updateChatHistory,
    updateChatHistoryLocal,
    onSelectAssistant,
    handleNewChat,
    assistants,
    userId,
    isLoading,
    isLoadingAssistants = false,
    resetUserInteractedRef,
    forceSelectAssistant
}) => {
    // Use old webhook hook for initial chat setup (still needed for handleNewChat)
    const {sendMessage: webhookSendMessage, isLoading: isLoadingWebhook, setWebhookLoading, error} = useWebhook(currentAssistant?.webhookUrl, userId);

    // Use new queue hook for message sending (non-blocking, with status)
    const {sendMessage: queueSendMessage, isProcessing: isProcessingQueue, queueLength} = useChatQueue(
        currentChat?.id || 'new',
        currentAssistant?.webhookUrl || '',
        userId,
        updateChatHistory
    );

    const { showNotification } = useNotification();
    const [input, setInput] = useState('');
    const [showInitialState, setShowInitialState] = useState(false);
    const [showAssistantSelect, setShowAssistantSelect] = useState(showInitialState);
    const [showArtifacts, setShowArtifacts] = useState(false);
    const [selectedArtifact, setSelectedArtifact] = useState<ChatHistory | null>(null);
    const [hasUserInteracted, setHasUserInteracted] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState<FileInfo[]>([]);
    const [attachedFilePreviews, setAttachedFilePreviews] = useState<{[key: string]: string}>({});
    
    // Redux state
    const dispatch = useAppDispatch();
    const showRightSidebar = useAppSelector(selectShowRightSidebar);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Get sidebar collapsed state
    const sidebarCollapsed = useAppSelector(selectSidebarCollapsed);

    // Get current user for personalized greeting
    const currentUser = useAppSelector((state) => state.user.currentUser);

    // Store greeting once when initial state is shown to prevent it from changing while typing
    const [initialGreeting, setInitialGreeting] = useState<string>('');

    // Time-based greeting function with variety
    const getTimeBasedGreeting = (fullName: string): string => {
        const hour = new Date().getHours(); // Uses system local time
        const firstName = fullName.split(' ')[0]; // Extract first name only

        // Random greeting selection for variety
        const pickRandom = (greetings: string[]) =>
            greetings[Math.floor(Math.random() * greetings.length)];

        let greeting = '';

        // Late night / early morning (midnight to 5 AM)
        if (hour >= 0 && hour < 5) {
            const lateNightGreetings = [
                `Burning the midnight oil, ${firstName}?`,
                `Still up, ${firstName}?`,
                `Late night session, ${firstName}?`,
                `Night owl mode, ${firstName}?`,
                `Hey ${firstName}, pulling an all-nighter?`,
                `Can't sleep, ${firstName}?`
            ];
            greeting = pickRandom(lateNightGreetings);
        }
        // Morning (5 AM to noon)
        else if (hour >= 5 && hour < 12) {
            const morningGreetings = [
                `Hey ${firstName}`,
                `Good morning, ${firstName}`,
                `Morning, ${firstName}`,
                `Hey there, ${firstName}`,
                `Rise and shine, ${firstName}`,
                `Hey ${firstName}, ready to start?`
            ];
            greeting = pickRandom(morningGreetings);
        }
        // Afternoon (noon to 6 PM)
        else if (hour >= 12 && hour < 18) {
            const afternoonGreetings = [
                `Hey ${firstName}`,
                `Good afternoon, ${firstName}`,
                `Afternoon, ${firstName}`,
                `Hey there, ${firstName}`,
                `Hey ${firstName}, how's it going?`,
                `What's up, ${firstName}?`
            ];
            greeting = pickRandom(afternoonGreetings);
        }
        // Evening (6 PM to midnight)
        else {
            const eveningGreetings = [
                `Hey ${firstName}`,
                `Good evening, ${firstName}`,
                `Evening, ${firstName}`,
                `Hey there, ${firstName}`,
                `Hey ${firstName}, how was your day?`,
                `What's up, ${firstName}?`
            ];
            greeting = pickRandom(eveningGreetings);
        }

        return greeting;
    };

    // Update the greeting only when showInitialState becomes true (when starting a new chat)
    useEffect(() => {
        if (showInitialState && !initialGreeting) {
            const newGreeting = currentUser?.name ? getTimeBasedGreeting(currentUser.name) : 'Welcome';
            setInitialGreeting(newGreeting);
        }
        // Reset greeting when leaving initial state
        if (!showInitialState) {
            setInitialGreeting('');
        }
    }, [showInitialState, currentUser?.name]);

    // Use the stored greeting to prevent it from changing while typing
    const greeting = initialGreeting || (currentUser?.name ? getTimeBasedGreeting(currentUser.name) : 'Welcome');

    // state для s2s ассистента
    const [voiceState, setVoiceState] = useState<{
        status: 'idle' | 'connecting' | 'active' | 'error' | 'thinking';
        isPaused: boolean;
        stream: MediaStream | null;
        onStart: () => Promise<void>;
        onPause: () => Promise<void>;
        onResume: () => Promise<void>;
        onStop: () => Promise<void>;
    } | null>(null);

    const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Показываем начальное состояние только если нет чата И пользователь не взаимодействовал
        // НЕ показываем начальное состояние если есть временные сообщения - они должны отображаться в чате
        setShowInitialState(!currentChat && !hasUserInteracted);
    }, [currentChat, hasUserInteracted]);

    // Сброс hasUserInteracted при нажатии New Chat
    useEffect(() => {
        if (resetUserInteractedRef?.current) {
            setHasUserInteracted(false);
            resetUserInteractedRef.current = false;
        }
    }, [resetUserInteractedRef?.current]);

    useEffect(() => {
        setShowAssistantSelect(showInitialState);
    }, [showInitialState]);

    // Reset attached files when chat changes
    useEffect(() => {
        setAttachedFiles([]);
        setAttachedFilePreviews({});
        handleCloseArtifacts();
    }, [currentChat?.id]);

    // Reset attached files when assistant changes
    useEffect(() => {
        setAttachedFiles([]);
        setAttachedFilePreviews({});
    }, [currentAssistant?.id]);



    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 950);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const updateVoiceState = (newState: any) => {
        if (!voiceState || 
            voiceState.status !== newState.status || 
            voiceState.isPaused !== newState.isPaused) {
            setVoiceState(newState);
            

            if (newState.status === 'idle' && voiceState?.status === 'active') {
                setIsLoadingTranscript(true);
            }
        }
    };

    const handleInputChange = (value: string) => {
        setInput(value);
    };

    const handleTextMessage = async (e: React.FormEvent | React.KeyboardEvent) => {
        e.preventDefault();
        // Allow queuing messages while processing (non-blocking)
        if (!input.trim() && attachedFiles.length === 0) return;

        const currentInput = input;
        setInput('');
        const isNewChat = showInitialState;
        setHasUserInteracted(true);

        try {
            // Convert attachedFiles to the format expected by the queue
            const files = attachedFiles.length > 0 ? attachedFiles : undefined;

            if (isNewChat) {
                // For new chats, create the chat first, then queue the message
                setWebhookLoading();
                const userMessage: ChatHistory = {
                    text: currentInput.trim() || (attachedFiles.length > 0 ? `[${attachedFiles.length} file(s) attached]` : ''),
                    sender: 'user',
                    isAudio: false,
                    hasAttachment: attachedFiles.length > 0,
                    files: files
                };
                updateChatHistoryLocal(userMessage);

                const assistantAndChatDto = await handleNewChat(currentInput.trim() || (attachedFiles.length > 0 ? `${attachedFiles.length} file(s) attached` : ''));

                if (assistantAndChatDto.chat.id) {
                    // Queue the message with the new chat ID
                    queueSendMessage(
                        currentInput.trim(),
                        files,
                        undefined, // no voice data
                        assistantAndChatDto.chat.id // override chat ID
                    );
                }
            } else {
                // Existing chat - just queue the message (non-blocking!)
                queueSendMessage(currentInput.trim(), files);
            }

            // Clear attached files
            setAttachedFiles([]);
            setAttachedFilePreviews({});

        } catch (error) {
            console.error('Failed to send message:', error);
            showNotification({
                type: 'error',
                title: 'Something went wrong',
                message: 'Failed to send message. Please try again later.',
                autoClose: true,
                duration: 5000
            });
        }
    };

    const handleFileAttach = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const removeAttachedFile = (fileToRemove: FileInfo) => {
        setAttachedFiles(prev => prev.filter(file => file !== fileToRemove));
        setAttachedFilePreviews(prev => {
            const newPreviews = { ...prev };
            delete newPreviews[fileToRemove.fileName];
            return newPreviews;
        });
    };

    const getFileBase64 = async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                const pureBase64 = result.split(',')[1];
                resolve(pureBase64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            // Проверяем лимит файлов
            if (files.length + attachedFiles.length > 3) {
                showNotification({
                    type: 'error',
                    title: 'File limit exceeded',
                    message: 'You can attach maximum 3 files at once.',
                    autoClose: true,
                    duration: 5000
                });
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }

            // Создаем FileInfo для каждого файла
            const fileInfos: FileInfo[] = [];
            
            for (const file of files) {
                const fileData = await getFileBase64(file);
                const fileInfo: FileInfo = {
                    fileName: file.name,
                    fileData: fileData,
                    fileMimeType: file.type,
                    isVideo: file.type.startsWith('video/'),
                    isImage: file.type.startsWith('image/'),
                    isDocument: !file.type.startsWith('image/') && !file.type.startsWith('video/') && !file.type.startsWith('audio/'),
                    isAudio: file.type.startsWith('audio/')
                };
                fileInfos.push(fileInfo);
                
                // Создаем превью для изображений
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        setAttachedFilePreviews(prev => ({
                            ...prev,
                            [file.name]: e.target?.result as string
                        }));
                    };
                    reader.readAsDataURL(file);
                }
            }
            
            // Добавляем новые FileInfo к существующим
            setAttachedFiles(prev => [...prev, ...fileInfos]);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleOpenArtifact = (artifact: ChatHistory) => {
        setSelectedArtifact(artifact);
        setShowArtifacts(true);
    };

    const handleCloseArtifacts = () => {
        setShowArtifacts(false);
        setSelectedArtifact(null);
        dispatch(setShowRightSidebar(false));
    };

    const handleOpenRightSidebar = (artifact?: ChatHistory) => {
        console.log('handleOpenRightSidebar called', artifact);
        
        // Если это статья, просто открываем её
        if (artifact?.isArticle) {
            setSelectedArtifact(artifact);
        }
        // Если артефакт не имеет кода, но в тексте есть код, извлекаем его
        else if (artifact && !artifact.artifact_code && artifact.text) {
            const extractCodeFromText = (text: string): string | null => {
                const codeBlockRegex = /```(?:(\w+)\n)?([\s\S]*?)```/;
                const match = text.match(codeBlockRegex);
                if (match) {
                    return match[2].trim();
                }
                
                const singleQuoteRegex = /'''([\s\S]*?)'''/;
                const singleMatch = text.match(singleQuoteRegex);
                if (singleMatch) {
                    return singleMatch[1].trim();
                }
                
                return null;
            };
            
            const extractedCode = extractCodeFromText(artifact.text);
            if (extractedCode) {
                const codeArtifact = {
                    ...artifact,
                    artifact_code: extractedCode,
                    isCode: true
                };
                console.log('Created code artifact:', codeArtifact);
                setSelectedArtifact(codeArtifact);
            } else {
                setSelectedArtifact(artifact);
            }
        } else {
            setSelectedArtifact(artifact);
        }
        
        dispatch(setShowRightSidebar(true));
        console.log('setShowRightSidebar dispatched');
        // Collapse sidebar when opening Right Sidebar
        if (!sidebarCollapsed) {
            dispatch(setSidebarCollapsed(true));
        }
    };

    const handleCloseRightSidebar = () => {
        dispatch(setShowRightSidebar(false));
    };

    const handleSuggestedAction = (action: string) => {
        setInput(action);
        // Don't automatically change state - wait for user to send
    };

    const handleRetryWithAssistant = async (assistantId: string) => {
        // todo этот метод работает не корректно полностью
        // Find the last user message to retry with the new assistant
        const lastUserMessage = chatHistory
            .slice()
            .reverse()
            .find(message => message.sender === 'user');
        
        if (lastUserMessage) {
            // Switch to the new assistant
            onSelectAssistant(assistantId);
            
            // Retry the last user message with the new assistant
            const retryMessage = {
                text: lastUserMessage.text,
                role: 'user' as const,
                isAudio: lastUserMessage.isAudio,
                hasAttachment: lastUserMessage.hasAttachment,
                audioFileName: lastUserMessage.audioFileName,
                audioData: lastUserMessage.audioData,
                audioMimeType: lastUserMessage.audioMimeType,
                files: lastUserMessage.files
            };

            // todo ретрай переделать
            // await onChatMessage(retryMessage, undefined);
        }
    };

    const maxDbId = Math.max(
        0,
        ...chatHistory.map(msg => Number(msg.id)).filter(id => !isNaN(id))
    );

    const suggestedActions = [
        { icon: <img src={codeIcon} alt="code" />, text: "Coding & developing" },
        { icon: <img src={documentIcon} alt="document" />, text: "Creation invoice" },
        { icon: <img src={directboxIcon} alt="directbox" />, text: "Email champing" },
        { icon: <img src={briefcaseIcon} alt="briefcase" />, text: "Financial consultation" },
        { icon: <img src={graphIcon} alt="document-upload" />, text: "Graphic cration" }
    ];

    return (
        <div className="w-full min-w-0 m-0 p-0 relative flex flex-col items-stretch justify-stretch bg-dark-bg transition-all duration-350 ease-custom" style={{ overflowX: 'hidden', paddingTop: '48px' }}>
            {/* Webhook error display - will be replaced by notification system */}
            {error && (
                <div className="fixed top-5 right-5 bg-red-500 text-white px-4 py-3 rounded-lg z-50 max-w-75">
                    Error: {error}
                </div>
            )}
            {/* Only show blocking overlay for initial chat creation, not for queue processing */}
            {isLoadingWebhook && showInitialState && (
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(38,38,36,0.7)', zIndex: 10
                }}>
                    <LoadingSpinner overlay overlaySize={32} />
                </div>
            )}

            {/* Chat Header - Only show when there's an active chat */}
            {/* {currentChat && chatHistory.length > 0 && (
                <ChatHeader 
                    assistant={currentAssistant}
                    onToggleArtifacts={() => setShowArtifacts(!showArtifacts)}
                    showArtifacts={showArtifacts}
                    hasArtifacts={assistantArtifacts.length > 0}
                    artifactsCount={assistantArtifacts.length}
                    hideArtifactsButton={true}
                />
            )} */}

            {/* Main chat area with artifacts sidebar */}
            <div className="flex-1 flex min-h-0 relative justify-center" style={{ overflowX: 'hidden' }}>
                {/* Main chat content */}
                <div className={`${showArtifacts || showRightSidebar ? 'flex-none w-1/2' : 'flex-1'} min-w-0 h-full flex flex-col items-center justify-end relative transition-all duration-350 ease-custom`} style={{ 
                    // maxWidth: '800px',
                    // margin: '0 auto',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'center',
                    marginLeft: isMobile ? '0' : (sidebarCollapsed ? '80px' : '287px')
                }}>
                    {showInitialState && (
                        <div className="flex-1 flex flex-col items-center justify-center w-full">
                            {/* Elegant Greeting */}
                            <div className="text-center mb-12" style={{ maxWidth: '700px' }}>
                                <h1 style={{
                                    fontSize: '40px',
                                    fontFamily: 'Georgia, serif',
                                    fontWeight: 400,
                                    color: 'rgba(255, 255, 255, 0.95)',
                                    marginBottom: '48px',
                                    letterSpacing: '-0.02em',
                                    lineHeight: '1.2'
                                }}>
                                    {greeting}
                                </h1>
                            </div>

                            {/* Chat Input - Prominent */}
                            <div className="w-full" style={{ maxWidth: '700px' }}>
                                <ChatInput
                                    input={input}
                                    setInput={handleInputChange}
                                    handleSend={handleTextMessage}
                                    handleFileAttach={handleFileAttach}
                                    onSelectAssistant={onSelectAssistant}
                                    assistant={currentAssistant}
                                    assistants={assistants}
                                    isLoading={isLoading}
                                    updateChatHistory={updateChatHistory}
                                    updateChatHistoryLocal={updateChatHistoryLocal}
                                    setWebhookLoading={setWebhookLoading}
                                    showInitialState={showInitialState}
                                    updateVoiceState={updateVoiceState}
                                    onTranscriptComplete={() => setIsLoadingTranscript(false)}
                                    currentChatId={currentChat?.id}
                                    chatHistory={chatHistory}
                                    maxDbId={maxDbId}
                                    sendMessage={sendMessage}
                                    onChatMessage={onChatMessage}
                                    handleNewChat={handleNewChat}
                                    setHasUserInteracted={setHasUserInteracted}
                                    isCentered={true}
                                    attachedFiles={attachedFiles}
                                    attachedFilePreviews={attachedFilePreviews}
                                    removeAttachedFile={removeAttachedFile}
                                    isLoadingAssistants={isLoadingAssistants}
                                    userId={userId}
                                    forceSelectAssistant={forceSelectAssistant}
                                />
                            </div>
                        </div>
                    )}

                                         {!showInitialState && (
                         <ChatMessages
                             messages={chatHistory}
                             assistant={currentAssistant}
                             assistants={assistants}
                             isLoading={isLoadingWebhook}
                             onToggleArtifacts={handleOpenArtifact}
                             onOpenRightSidebar={handleOpenRightSidebar}
                             onRetryWithAssistant={handleRetryWithAssistant}
                         />
                     )}
                    <TranscriptLoader isVisible={isLoadingTranscript} />
                    
                    {/* Chat Input at Bottom - Show when user has interacted or there's chat history */}
                    {!showInitialState && (
                        <ChatInput
                            input={input}
                            setInput={handleInputChange}
                            handleSend={handleTextMessage}
                            handleFileAttach={handleFileAttach}
                            onSelectAssistant={onSelectAssistant}
                            assistant={currentAssistant}
                            assistants={assistants}
                            isLoading={isLoading}
                            updateChatHistory={updateChatHistory}
                            updateChatHistoryLocal={updateChatHistoryLocal}
                            setWebhookLoading={setWebhookLoading}
                            showInitialState={showInitialState}
                            updateVoiceState={updateVoiceState}
                            onTranscriptComplete={() => setIsLoadingTranscript(false)}
                            currentChatId={currentChat?.id}
                            chatHistory={chatHistory}
                            maxDbId={maxDbId}
                            sendMessage={sendMessage}
                            onChatMessage={onChatMessage}
                            handleNewChat={handleNewChat}
                            setHasUserInteracted={setHasUserInteracted}
                            isCentered={false}
                            attachedFiles={attachedFiles}
                            attachedFilePreviews={attachedFilePreviews}
                            removeAttachedFile={removeAttachedFile}
                            isLoadingAssistants={isLoadingAssistants}
                            userId={userId}
                            forceSelectAssistant={forceSelectAssistant}
                        />
                    )}
                </div>

                {/* Artifact Sidebar */}
                <ArtifactSidebar
                    isOpen={showArtifacts || showRightSidebar}
                    onClose={showArtifacts ? handleCloseArtifacts : handleCloseRightSidebar}
                    selectedArtifact={selectedArtifact}
                />
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                onChange={handleFileChange}
            />

            {/* Voice Agent Conversation Page */}
            <AnimatePresence>
                {voiceState && (voiceState.status === 'active' || voiceState.status === 'thinking' || voiceState.status === 'connecting') && (
                    <ConversationPage
                        isActive={voiceState.status === 'active'}
                        isThinking={voiceState.status === 'thinking'}
                        isPaused={voiceState.isPaused}
                        audioStream={voiceState.stream}
                        onStart={voiceState.onStart}
                        onPause={voiceState.onPause}
                        onResume={voiceState.onResume}
                        onStop={voiceState.onStop}
                    />
                )}
            </AnimatePresence>

        </div>
    );
};

export default ChatArea;