import { useState, useRef, useCallback } from 'react';
import { useConversation } from '@elevenlabs/react';

type Status = 'idle' | 'connecting' | 'active' | 'error' | 'thinking';

export const useVoiceAgent = () => {
    const [status, setStatus] = useState<Status>('idle');
    const [error, setError] = useState<string | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [showError, setShowError] = useState(false);
    const [isStoppingCall, setIsStoppingCall] = useState(false);
    const streamRef = useRef<MediaStream | null>(null);
    const conversationIdRef = useRef<string | null>(null);
    const activeStreamsRef = useRef<MediaStream[]>([]);
    const sessionClosedRef = useRef<boolean>(false);

    // Initialize ElevenLabs conversation hook
    const conversation = useConversation({
        apiKey: 'sk_3c3c83bdce7a69742837261149687cf4c7611c10a09f5804',
        agentId: 'agent_01jzaya63we538s2m1fx3ckgg9',
        onConnect: () => {
            console.log('ElevenLabs conversation connected');
            setStatus('active');
            sessionClosedRef.current = false;
        },
        onMessage: (message) => {
            console.log('Received message from ElevenLabs:', message);
            if (conversation.isSpeaking) {
                setStatus('active');
            } else {
                setStatus('thinking');
            }
        },
        onError: (error) => {
            console.error('ElevenLabs conversation error:', error);
            setError('Failed to connect to voice agent');
            setShowError(true);
            setStatus('error');
            sessionClosedRef.current = true;
            cleanupStream();
        },
        onDisconnect: () => {
            console.log('ElevenLabs conversation disconnected');
            sessionClosedRef.current = true;
            setStatus('idle');
        }
    });

    const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
    navigator.mediaDevices.getUserMedia = async (constraints) => {
        const stream = await originalGetUserMedia.call(navigator.mediaDevices, constraints);

        if (constraints!.audio) {
            activeStreamsRef.current.push(stream);
            console.log('New audio stream tracked:', stream);
        }

        return stream;
    };

    const cleanupStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        activeStreamsRef.current.forEach(stream => {
            stream.getTracks().forEach(track => track.stop());
        });
        activeStreamsRef.current = [];
        if (conversation && status === 'active' && !sessionClosedRef.current) {
            try {
                conversation.endSession();
                sessionClosedRef.current = true;
            } catch (err) {
                console.warn('Session already closed:', err);
                sessionClosedRef.current = true;
            }
        }
    }, [conversation, status]);

    const handleStart = async () => {
        try {
            setStatus('connecting');
            setError(null);
            setShowError(false);
            setIsStoppingCall(false);
            sessionClosedRef.current = false;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            console.log('Audio stream obtained:', stream);

            console.log('Starting ElevenLabs session...');
            const conversationId = await conversation.startSession();
            conversationIdRef.current = conversationId;
        } catch (err) {
            console.error('Failed to start voice agent:', err);
            setError('Failed to start voice agent');
            setShowError(true);
            setStatus('error');
            cleanupStream();
        }
    };

    const handleStop = async () => {
        try {
            setIsStoppingCall(true);

            if (conversation && status === 'active' && !sessionClosedRef.current) {
                try {
                    await conversation.endSession();
                    sessionClosedRef.current = true;
                } catch (err) {
                    console.warn('Session already closed:', err);
                    sessionClosedRef.current = true;
                }
            } else {
                console.log('Session already closed or not active, skipping endSession');
            }
        } catch (err) {
            console.error('Failed to end conversation:', err);
            setError('Failed to end conversation properly');
            setShowError(true);
        } finally {
            setStatus('idle');
            setIsPaused(false);
            cleanupStream();
            conversationIdRef.current = null;
            setIsStoppingCall(false);
        }
    };

    const handlePause = async () => {
        try {
            if (streamRef.current) {
                setIsPaused(true);
                activeStreamsRef.current.forEach((stream) => {
                    stream.getAudioTracks().forEach((track) => {
                        track.enabled = false;
                        console.log('Paused track:', track);
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
    };

    const handleResume = async () => {
        try {
            if (conversationIdRef.current && streamRef.current) {
                setIsPaused(false);
                activeStreamsRef.current.forEach((stream) => {
                    stream.getAudioTracks().forEach((track) => {
                        track.enabled = true;
                        console.log('Resumed track:', track);
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
    };

    return {
        status,
        error,
        isPaused,
        showError,
        isStoppingCall,
        streamRef: streamRef.current,
        setShowError,
        handleStart,
        handleStop,
        handlePause,
        handleResume,
        cleanupStream,
        conversationId: conversationIdRef.current
    };
}; 