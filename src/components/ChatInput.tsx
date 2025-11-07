import React, {useCallback, useEffect, useRef, useState} from 'react';
import {VoiceAgentButton} from './voiceAgent/VoiceAgentButton';
import {VoiceRecordingInterface} from './VoiceRecordingInterface';
import AssistantSelector from './AssistantSelector';
import {Assistant} from '../types/model/Assistant';
import {ChatHistory, FileInfo} from '../types/model/ChatHistory';
import addWhiteIcon from '../assets/icons/add-white.svg';
import microphoneIcon from '../assets/icons/microphone.svg';
import {AssistantAndChatDto} from "../types/n8n/AssistantsWithChatsDto";


interface ChatInputProps {
    input: string;
    setInput: (value: string) => void;
    handleSend: (e: React.FormEvent | React.KeyboardEvent) => void;
    handleFileAttach: () => void;
    onSelectAssistant: (assistantId: string) => void;
    assistant?: Assistant;
    assistants: Assistant[];
    isLoading: boolean;
    updateChatHistory: (newMessage: ChatHistory, isNewChat?: boolean) => void;
    updateChatHistoryLocal: (newMessage: ChatHistory) => void;
    updateVoiceState?: (state: any) => void;
    onTranscriptComplete?: () => void;
    currentChatId?: string;
    chatHistory: import('../types/model/ChatHistory').ChatHistory[];
    maxDbId: number;
    sendMessage: (params: { message: any; assistantUrl: string; audio?: Blob; file?: File }) => Promise<any>;
    setWebhookLoading: () => void;
    showInitialState: boolean;
    onChatMessage: (msg: ChatHistory) => Promise<ChatHistory>;
    handleNewChat: (chatFirstMessage: string) => Promise<AssistantAndChatDto>;
    setHasUserInteracted: (state: boolean) => void;
    isCentered?: boolean;
    attachedFiles?: FileInfo[];
    attachedFilePreviews?: { [key: string]: string };
    removeAttachedFile?: (fileToRemove: FileInfo) => void;
    addAttachedFile?: (fileInfo: FileInfo) => void;
    isLoadingAssistants?: boolean;
    userId: string;
    forceSelectAssistant: (assistantId: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
                                                  input,
                                                  setInput,
                                                  handleSend,
                                                  handleFileAttach,
                                                  onSelectAssistant,
                                                  assistant,
                                                  assistants,
                                                  isLoading,
                                                  updateChatHistory,
                                                  updateChatHistoryLocal,
                                                  updateVoiceState,
                                                  onTranscriptComplete,
                                                  currentChatId,
                                                  chatHistory,
                                                  maxDbId,
                                                  sendMessage,
                                                  setWebhookLoading,
                                                  showInitialState,
                                                  onChatMessage,
                                                  handleNewChat,
                                                  setHasUserInteracted,
                                                  isCentered = false,
                                                  attachedFiles = [],
                                                  attachedFilePreviews = {},
                                                  removeAttachedFile,
                                                  isLoadingAssistants = false,
                                                  userId,
    forceSelectAssistant,
                                              }) => {
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isVoiceRecording, setIsVoiceRecording] = useState(false);
    const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
    const [audioLevel, setAudioLevel] = useState(0);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const recordingStartTimeRef = useRef<number | null>(null);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Analyze audio levels
    const analyzeAudio = useCallback(() => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume level
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const normalizedLevel = Math.min(average / 128, 1); // Normalize to 0-1

        setAudioLevel(normalizedLevel);

        // Continue animation
        animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    }, []);

    // Start voice recording
    const startVoiceRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({audio: true});
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            // Setup audio analysis
            audioContextRef.current = new AudioContext();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            source.connect(analyserRef.current);

            // Start audio analysis
            setAudioLevel(0);
            analyzeAudio();

            // Clear previous chunks
            setAudioChunks([]);

            mediaRecorder.ondataavailable = (event) => {
                setAudioChunks(prev => [...prev, event.data]);
            };

            mediaRecorder.onstop = () => {
                // Don't set audioChunks here, it's already set in ondataavailable
            };

            mediaRecorder.start(1000); // Collect data every 1 second
            setIsVoiceRecording(true);

            // Start recording timer
            recordingStartTimeRef.current = Date.now();
            setRecordingDuration(0);
            recordingTimerRef.current = setInterval(() => {
                if (recordingStartTimeRef.current) {
                    const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
                    setRecordingDuration(elapsed);
                }
            }, 1000);
        } catch (error) {
            console.error('Failed to start recording:', error);
        }
    }, [analyzeAudio]);

    // Stop voice recording
    const stopVoiceRecording = useCallback(() => {
        if (mediaRecorderRef.current && isVoiceRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());

            // Stop audio analysis
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
            analyserRef.current = null;
            setAudioLevel(0);

            setIsVoiceRecording(false);
        }
    }, [isVoiceRecording]);

    // Cancel voice recording
    const cancelVoiceRecording = useCallback(() => {
        if (mediaRecorderRef.current && isVoiceRecording) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());

            // Stop audio analysis
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
            analyserRef.current = null;
            setAudioLevel(0);

            // Stop recording timer
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
                recordingTimerRef.current = null;
            }
            recordingStartTimeRef.current = null;
            setRecordingDuration(0);

            setIsVoiceRecording(false);
            setAudioChunks([]);
        }
    }, [isVoiceRecording]);

    // Send voice recording
    const sendVoiceRecording = useCallback(async () => {
        if (audioChunks.length === 0) {
            return;
        }

        // Stop recording first
        if (mediaRecorderRef.current && isVoiceRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());

            // Stop audio analysis
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }

            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
            analyserRef.current = null;
            setAudioLevel(0);

            // Stop recording timer
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
                recordingTimerRef.current = null;
            }
            recordingStartTimeRef.current = null;
            setRecordingDuration(0);

            setIsVoiceRecording(false);
        }

        try {
            const isNewChat = showInitialState;
            setHasUserInteracted(true);

            const audioBlob = new Blob(audioChunks, {type: 'audio/webm'});

            // Convert blob to base64
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(audioBlob);
            });

            const pureBase64 = base64.split(',')[1];

            let userMessage: ChatHistory = {
                text: '',
                sender: 'user',
                isAudio: true,
                audioFileName: 'voice-message.webm',
                audioData: pureBase64,
                audioMimeType: 'audio/webm',
                duration: recordingDuration,
                hasAttachment: false
            }

            let assistantAndChatDto: AssistantAndChatDto;
            let messageToSend: ChatHistory;
            if (isNewChat) {
                setWebhookLoading();
                updateChatHistoryLocal(userMessage);
                assistantAndChatDto = await handleNewChat('Voice conversation');
                if (assistantAndChatDto.chat.id) {
                    userMessage = {
                        ...userMessage,
                        chatId: assistantAndChatDto.chat.id
                    }
                    messageToSend = await onChatMessage(userMessage);
                }
            } else {
                messageToSend = await onChatMessage(userMessage);
            }

            // Use the existing sendMessage logic to trigger spinner and server response
            const messageFromServer = await sendMessage({
                message: messageToSend,
                assistantUrl: assistant?.webhookUrl ? assistant.webhookUrl :
                    (assistantAndChatDto?.assistant?.webhookUrl ? assistantAndChatDto.assistant.webhookUrl : undefined),
                audio: audioBlob
            });

            updateChatHistory(messageFromServer, isNewChat);
            
            setAudioChunks([]);
        } catch (error) {
            console.error('Failed to send voice message:', error);
        }
    }, [audioChunks, onChatMessage, sendMessage, updateChatHistory, isVoiceRecording, recordingDuration]);

    // Handle microphone button click
    const handleMicrophoneClick = useCallback(() => {
        if (isVoiceRecording) {
            stopVoiceRecording();
        } else {
            startVoiceRecording();
        }
    }, [isVoiceRecording, startVoiceRecording, stopVoiceRecording]);

    // Handle voice recording confirmation
    const handleVoiceConfirm = useCallback(() => {
        sendVoiceRecording();
    }, [sendVoiceRecording]);

    // Handle voice recording cancellation
    const handleVoiceCancel = useCallback(() => {
        cancelVoiceRecording();
    }, [cancelVoiceRecording]);

    // Auto-resize textarea based on content
    useEffect(() => {
        if (inputRef.current) {
            // Reset height to auto to get the correct scrollHeight
            inputRef.current.style.height = 'auto';
            // Set the height to scrollHeight to fit content
            const scrollHeight = inputRef.current.scrollHeight;
            const maxHeight = 460;
            const newHeight = Math.min(scrollHeight, maxHeight);
            inputRef.current.style.height = `${newHeight}px`;
        }
    }, [input]);

    return (
        <>
            <div className={`w-full px-4 ${isCentered ? '' : 'pb-8'}`}
                 style={{maxWidth: '800px', margin: '0 auto', width: '100%'}}>
                <form
                    onSubmit={handleSend}
                    className="w-full max-w-4xl mx-auto rounded-2xl shadow-custom px-6 py-4 flex flex-col justify-between"
                    style={{
                        backgroundColor: 'rgb(48, 48, 46)',
                        minHeight: isCentered ? '160px' : '132px',
                        maxHeight: '460px'
                    }}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                    />

                    {/* File Preview */}
                    {attachedFiles.length > 0 && (
                        <div className="mb-2">
                            <div className="flex flex-wrap items-center gap-2">
                                {attachedFiles.map((fileInfo, index) => (
                                    <div key={`${fileInfo.fileName}-${index}`}
                                         className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-transparent border border-gray-600">
                                        {fileInfo.isImage && attachedFilePreviews[fileInfo.fileName] ? (
                                            <img
                                                src={attachedFilePreviews[fileInfo.fileName]}
                                                alt="Preview"
                                                className="w-6 h-6 rounded object-cover"
                                            />
                                        ) : (
                                            <span className="text-gray-400 text-sm">
                                        {fileInfo.isImage ? '🖼️' :
                                            fileInfo.isAudio ? '🎵' :
                                                fileInfo.isVideo ? '🎬' : '📄'}
                                    </span>
                                        )}
                                        <span
                                            className="text-white text-xs font-medium max-w-32 truncate">{fileInfo.fileName}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeAttachedFile(fileInfo)}
                                            className="text-gray-400 hover:text-white transition-colors duration-200 ml-1"
                                            title="Remove file"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                      d="M6 18L18 6M6 6l12 12"/>
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                            {/* File limit indicator */}
                            <div className="mt-2 text-xs text-gray-400" style={{ marginLeft: '6px' }}>
                                {attachedFiles.length >= 3 
                                    ? "3/3 files attached. Maximum 3 files reached." 
                                    : `${attachedFiles.length}/3 files attached`
                                }
                            </div>
                        </div>
                    )}

                    {/* Textarea or Voice Recording Interface */}
                    {isVoiceRecording ? (
                        <VoiceRecordingInterface
                            audioLevel={audioLevel}
                            assistantName={assistant?.name || ''}
                            onAssistantChange={onSelectAssistant}
                            assistants={assistants}
                            currentAssistantId={assistant?.id}
                            onConfirm={handleVoiceConfirm}
                            onCancel={handleVoiceCancel}
                            onAddAttachment={handleFileAttach}
                            recordingDuration={recordingDuration}
                        />
                    ) : (
                        <textarea
                            ref={inputRef}
                            placeholder={attachedFiles.length > 0 ? "Add a message or press enter to send" : "How can I help you today?"}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend(e);
                                }
                            }}
                            className="w-full bg-transparent border-none text-white text-sm outline-none resize-none custom-placeholder font-cyrillic"
                            style={{ lineHeight: '1.6' }}
                        />
                    )}

                    {/* Bottom controls - Hidden during voice recording */}
                    {!isVoiceRecording && (
                        <div className="flex justify-between items-center mt-4">
                            {/* Left side - Add and Sort icons */}
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleFileAttach}
                                    disabled={attachedFiles.length >= 3}
                                    className={`w-11 h-11 rounded-full border border-gray-600 flex items-center justify-center cursor-pointer p-0 transition-colors duration-200 ${
                                        attachedFiles.length >= 3 
                                            ? 'opacity-50 cursor-not-allowed' 
                                            : 'hover:bg-background-light'
                                    }`}
                                    title={attachedFiles.length >= 3 ? 'Maximum 3 files allowed' : 'Add files'}
                                >
                                    <img
                                        src={addWhiteIcon}
                                        alt="Add"
                                        className="w-6 h-6 object-contain"
                                    />
                                </button>
                                {/* <button
                                type="button"
                                className="w-11 h-11 rounded-full  border border-gray-600 flex items-center justify-center cursor-pointer p-0 hover:bg-background-light transition-colors duration-200"
                            >
                                <img 
                                    src={sortIcon} 
                                    alt="Sort" 
                                    className="w-6 h-6 object-contain"
                                />
                            </button> */}
                            </div>

                            {/* Right side - Assistant selector, microphone, and voice recorder */}
                            <div className="flex items-center gap-3">
                                {/* Assistant selector */}
                                <AssistantSelector
                                    assistants={assistants}
                                    selectedAssistant={assistant}
                                    forceSelectAssistant={forceSelectAssistant}
                                    disabled={isLoadingAssistants}
                                />

                                {/* Microphone button */}
                                <button
                                    type="button"
                                    onClick={handleMicrophoneClick}
                                    disabled={isLoading}
                                    className={`w-11 h-11 rounded-full border-none flex items-center justify-center cursor-pointer p-0 ${isVoiceRecording ? 'animate-pulse' : ''} hover:opacity-80 transition-opacity duration-200`}
                                    style={{backgroundColor: 'rgb(48, 48, 46)'}}
                                    title="Voice input"
                                >
                                    <img
                                        src={microphoneIcon}
                                        alt="Microphone"
                                        className="w-6 h-6 object-contain"
                                    />
                                </button>

                                {/* Voice recorder button */}
                                <VoiceAgentButton
                                    updateChatHistory={updateChatHistory}
                                    updateVoiceState={updateVoiceState}
                                    onTranscriptComplete={onTranscriptComplete}
                                    currentChatId={currentChatId}
                                    chatHistory={chatHistory}
                                    maxDbId={maxDbId}
                                    input={input}
                                    handleSend={handleSend}
                                    assistant={assistant}
                                    showInitialState={showInitialState}
                                    setHasUserInteracted={setHasUserInteracted}
                                    handleNewChat={handleNewChat}
                                    userId={userId}
                                    isLoadingAssistants={isLoadingAssistants}
                                />


                            </div>
                        </div>
                    )}
                </form>
            </div>
        </>
    );
};

export default ChatInput; 