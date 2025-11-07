import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Loader2} from 'lucide-react';
import {AnimatePresence, motion} from 'framer-motion';
import {useConversation} from '@11labs/react';
import {useTranscriptFetch} from '../../hooks/useTranscriptFetch';
import {useNotification} from '../../hooks/useNotification';
import voiceSquareIcon from '../../assets/icons/voice-square.svg';
import {ChatHistory} from "../../types/model/ChatHistory";
import {Assistant} from "../../types/model/Assistant";
import {AssistantAndChatDto} from "../../types/n8n/AssistantsWithChatsDto";
import {saveChatHistory} from "../../services/ChatHistoryCRUDService";

type Status = 'idle' | 'connecting' | 'active' | 'error' | 'thinking';

interface VoiceAgentButtonProps {
    updateChatHistory: (newMessage: ChatHistory, isNewChat?: boolean) => void;
    updateVoiceState?: (state: any) => void;
    onTranscriptComplete?: () => void;
    currentChatId?: string;
    chatHistory: import('../../types/model/ChatHistory').ChatHistory[];
    maxDbId: number;
    input: string;
    handleSend: (e: React.FormEvent | React.KeyboardEvent) => void;
    assistant?: Assistant;
    showInitialState: boolean;
    setHasUserInteracted: (state: boolean) => void;
    handleNewChat: (chatFirstMessage: string) => Promise<AssistantAndChatDto>;
    userId: string;
    isLoadingAssistants: boolean;
}

export const VoiceAgentButton: React.FC<VoiceAgentButtonProps> = ({
    updateChatHistory,
    updateVoiceState,
    onTranscriptComplete,
    currentChatId,
    chatHistory,
    maxDbId,
    input,
    handleSend,
    assistant,
    showInitialState,
    setHasUserInteracted,
    handleNewChat,
    userId,
    isLoadingAssistants
}) => {
    const [status, setStatus] = useState<Status>('idle');
    const [error, setError] = useState<string | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [showError, setShowError] = useState(false);
    const [isStoppingCall, setIsStoppingCall] = useState(false);
    const streamRef = useRef<MediaStream | null>(null);
    const conversationIdRef = useRef<string | null>(null);
    const { fetchTranscript } = useTranscriptFetch();
    const { showNotification } = useNotification();
    const activeStreamsRef = useRef<MediaStream[]>([]);

    const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
    navigator.mediaDevices.getUserMedia = async (constraints) => {
        const stream = await originalGetUserMedia.call(navigator.mediaDevices, constraints);

        // Track the stream if it's audio
        if (constraints!.audio) {
            activeStreamsRef.current.push(stream);
        }

        return stream;
    };

    const conversation = useConversation({
        apiKey: 'sk_3c3c83bdce7a69742837261149687cf4c7611c10a09f5804',
        agentId: assistant?.s2sToken ,
        onConnect: () => {
            console.log('ElevenLabs conversation connected');
            setStatus('active');
            setError(null);
        },
        onDisconnect: () => {
            console.log('ElevenLabs conversation disconnected');
            if (status !== 'idle') {
                setStatus('idle');
                cleanupStream();
            }
        },
        onError: (err) => {
            console.error('Conversation error:', err);
            setError('Connection error occurred');
            setShowError(true);
            setStatus('error');
            cleanupStream();
        },
        onMessage: (message) => {
            console.log('Received message from ElevenLabs:', message);
            if (status === 'thinking') {
                setStatus('active');
            }
        }
    });

    const cleanupStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    const handleStart = useCallback(async () => {
        try {
            if (status !== 'idle' && status !== 'error') {
                console.log('Already starting or active, skipping...');
                return;
            }

            if (!assistant) {
                showNotification({
                    type: 'warning',
                    title: 'Assistant Not Loaded',
                    message: 'The Speech-to-Speech function requires a specific assistant token. Please select an assistant and try again.',
                    autoClose: true,
                    duration: 5000
                });
                return;
            } else if (!assistant?.s2sToken) {
                showNotification({
                    type: 'error',
                    title: 'Invalid Agent ID',
                    message: 'The selected assistant has no valid agent ID. Please check the assistant configuration.',
                    autoClose: true,
                    duration: 5000
                });
                return;
            }
            
            console.log('Starting voice agent...');
            setStatus('connecting');
            setError(null);
            setShowError(false);
            setIsStoppingCall(false);

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            console.log('Audio stream obtained:', stream);

            if (!conversationIdRef.current) {
                console.log('Starting new conversation...');
                const convId = await conversation.startSession();
                conversationIdRef.current = convId;
                console.log('New conversation started with ID:', convId);
            } else {
                // Note: resumeSession might not be available in this version
                console.log('Resuming conversation with ID:', conversationIdRef.current);
            }
        } catch (err) {
            console.error('Failed to start/resume conversation:', err);
            
            // Проверяем, связана ли ошибка с agent_id
            const errorMessage = err instanceof Error ? err.message : String(err);
            if (errorMessage.includes('agent_id') || errorMessage.includes('agentId') || errorMessage.includes('invalid agent')) {
                showNotification({
                    type: 'error',
                    title: 'Invalid Agent ID',
                    message: 'The selected assistant has an invalid agent ID. Please check the assistant configuration.',
                    autoClose: true,
                    duration: 5000
                });
            } else {
                showNotification({
                    type: 'error',
                    title: 'Connection Failed',
                    message: 'Failed to start conversation. Please try again later.',
                    autoClose: true,
                    duration: 5000
                });
            }
            
            setStatus('error');
            cleanupStream();
        }
    }, [conversation, status]);

    const handleStop = useCallback(async () => {
        try {
            console.log('Stopping voice agent...');
            setIsStoppingCall(true);

            setStatus('idle');
            setIsPaused(false);
            cleanupStream();
            
            // Store conversation ID for async transcript fetching
            const conversationId = conversationIdRef.current;
            conversationIdRef.current = null;
            
            if (conversationId) {
                console.log('Ending session for conversation:', conversationId);
                
                // Transcript loader will be shown by ChatArea component
                
                // End session and fetch transcript in background
                conversation.endSession().then(async () => {
                    try {
                        const isNewChat = showInitialState;
                        setHasUserInteracted(true);

                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        console.log('Fetching transcript for conversation:', conversationId);
                        const transcript = await fetchTranscript(conversationId);
                        
                        if (transcript) {
                            console.log('Received transcript:', transcript);

                            let assistantAndChatDto: AssistantAndChatDto;
                            if (isNewChat) {
                                assistantAndChatDto = await handleNewChat('Speech-to-Speech conversation');
                            }

                            const messages: ChatHistory[] = transcript.map(msg => ({
                                text: msg.message,
                                sender: (msg.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
                                chatId: isNewChat ? assistantAndChatDto.chat.id : currentChatId,
                                sentDate: new Date().toISOString(),
                            }))
                            .filter(msg => {
                                const text = msg.text?.trim();
                                return text !== null && text !== undefined && text !== '';
                            });

                            try {
                                await saveChatHistory(userId, messages);
                            } catch (error) {
                                console.error('Failed to send messages to backend:', error);
                                showNotification({
                                    type: 'error',
                                    title: 'Failed to save conversation',
                                    message: 'Your conversation was recorded but could not be saved. Please try again later.',
                                    autoClose: true,
                                    duration: 5000
                                });
                            }

                            updateChatHistory(null, true);
                            
                            // Hide transcript loader
                            if (onTranscriptComplete) {
                                onTranscriptComplete();
                            }
                        } else {
                            console.error('No transcript received');
                            setError('Failed to get conversation transcript');
                            setShowError(true);
                        }
                    } catch (err) {
                        console.error('Failed to fetch transcript:', err);
                        setError('Failed to get conversation transcript');
                        setShowError(true);
                    }
                }).catch(err => {
                    console.error('Failed to end session:', err);
                    setError('Failed to end conversation properly');
                    setShowError(true);
                });
            }
        } catch (err) {
            console.error('Failed to stop conversation:', err);
            setError('Failed to stop conversation');
            setShowError(true);
            setStatus('idle');
            setIsPaused(false);
            cleanupStream();
            conversationIdRef.current = null;
        } finally {
            setIsStoppingCall(false);
        }
    }, [conversation, fetchTranscript, updateChatHistory, maxDbId]);

    const handlePause = useCallback(async () => {
        try {
            if (streamRef.current) {
                setIsPaused(true);
                activeStreamsRef.current.forEach((stream) => {
                    stream.getAudioTracks().forEach((track) => {
                        track.enabled = false; // Disable the audio track
                    });
                });
            } else {
                throw new Error('No active stream to pause');
            }
        } catch (err) {
            console.error('Failed to pause:', err);
            setError('Failed to pause conversation');
            setShowError(true);
        }
    }, []);

    const handleResume = useCallback(async () => {
        try {
            if (conversationIdRef.current) {
                if(streamRef===null) {
                    return;
                }

                if(streamRef.current===null){
                    return;
                }

                setIsPaused(false);
                activeStreamsRef.current.forEach((stream) => {
                    stream.getAudioTracks().forEach((track) => {
                        track.enabled = true; // Re-enable the audio track
                    });
                });
            } else {
                throw new Error('No active conversation to resume');
            }
        } catch (err) {
            console.error('Failed to resume:', err);
            setError(err instanceof Error ? err.message : 'Failed to resume conversation');
            setShowError(true);
        }
    }, []);


    const prevStateRef = useRef({ status, isPaused });
    
    useEffect(() => {
        const currentState = { status, isPaused };
        const prevState = prevStateRef.current;

        if (updateVoiceState && 
            (currentState.status !== prevState.status || currentState.isPaused !== prevState.isPaused) &&
            status !== 'connecting') {
            prevStateRef.current = currentState;
            updateVoiceState({
                status,
                isPaused,
                stream: streamRef.current,
                onStart: handleStart,
                onPause: handlePause,
                onResume: handleResume,
                onStop: handleStop
            });
        }
    }, [status, isPaused]);


    return (
        <div className="relative">
            <motion.button
                onClick={status === 'connecting' || isLoadingAssistants ? undefined : (e => {
                    if (input && input.trim().length > 0) {
                        handleSend(e);
                    } else {
                        handleStart();
                    }
                })}
                whileHover={!isLoadingAssistants ? { scale: 1.05 } : {}}
                whileTap={!isLoadingAssistants ? { scale: 0.95 } : {}}
                className={`w-11 h-11 rounded-full bg-primary border-none flex items-center justify-center transition-all duration-200 ease-in-out p-0 ${
                    status === 'connecting' || isLoadingAssistants 
                        ? 'cursor-not-allowed opacity-50' 
                        : 'cursor-pointer'
                }`}
                disabled={status === 'connecting' || isLoadingAssistants}
            >
                {status === 'connecting' ? (
                    <Loader2 size={24} className="animate-spin text-gray-900" />
                ) : input && input.trim().length > 0 ? (
                    // Send button
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'translate(-1px, 1.5px)' }}>
                        <path d="M22 2L11 13" stroke="#262624" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#262624" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                ) : (
                    // Voice agent button with voiceSquareIcon
                    <img 
                        src={voiceSquareIcon} 
                        alt="Voice Agent" 
                        className="w-6 h-6 object-contain"
                    />
                )}
            </motion.button>

            <AnimatePresence>
                {error && showError && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 min-w-50 bg-red-500 text-white rounded-lg shadow-lg overflow-hidden z-50"
                    >
                        <div className="px-4 py-3 relative">
                            <div className="text-sm font-medium">{error}</div>
                            <button
                                onClick={() => setShowError(false)}
                                className="absolute top-1 right-1 p-1 bg-transparent border-none text-white cursor-pointer rounded-full transition-colors duration-200 hover:bg-white/10"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="h-1 bg-red-600 animate-countdown" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};