import { useCallback, useRef, useState, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react-native';
import { ELEVENLABS_API_KEY } from '@env';

interface UseVoiceSessionProps {
  agentId: string | undefined;
}

export interface VoiceSessionState {
  status: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
  isSpeaking: boolean;
  isListening: boolean;
  error: string | null;
  conversationId: string | null;
}

export const useVoiceSession = ({ agentId }: UseVoiceSessionProps) => {
  const [sessionState, setSessionState] = useState<VoiceSessionState>({
    status: 'idle',
    isSpeaking: false,
    isListening: false,
    error: null,
    conversationId: null,
  });

  const conversationIdRef = useRef<string | null>(null);
  const isStartingRef = useRef(false); // Guard against duplicate starts

  // Initialize Eleven Labs conversation hook
  const conversation = useConversation({
    onConnect: useCallback(() => {
      console.log('✅ Voice session connected');
      isStartingRef.current = false; // Reset guard
      setSessionState((prev) => ({
        ...prev,
        status: 'connected',
        error: null,
      }));

      // Get conversation ID using function scope
      if (conversation) {
        const convId = conversation.getId();
        if (convId) {
          conversationIdRef.current = convId;
          setSessionState((prev) => ({
            ...prev,
            conversationId: convId,
          }));
        }
      }
    }, [conversation]),

    onDisconnect: useCallback(() => {
      console.log('🔌 Voice session disconnected');
      setSessionState((prev) => ({
        ...prev,
        status: 'disconnected',
        isSpeaking: false,
        isListening: false,
      }));
    }, []),

    onError: useCallback((error: Error) => {
      console.error('❌ Voice session error:', error);
      setSessionState((prev) => ({
        ...prev,
        status: 'error',
        error: error.message || 'Unknown error occurred',
        isSpeaking: false,
        isListening: false,
      }));
    }, []),

    onModeChange: useCallback(
      ({ mode }: { mode: 'speaking' | 'listening' | 'thinking' | 'idle' }) => {
        console.log('🎙️ Voice mode changed:', mode);
        setSessionState((prev) => ({
          ...prev,
          isSpeaking: mode === 'speaking',
          isListening: mode === 'listening',
        }));
      },
      []
    ),

    onMessage: useCallback((message: any) => {
      console.log('💬 Voice message:', message);
      // Can be used for transcription display in future
    }, []),
  });

  // Start voice session
  const startSession = useCallback(async () => {
    // Guard against duplicate starts
    if (isStartingRef.current) {
      console.log('⚠️ Session already starting, ignoring duplicate request');
      return false;
    }

    if (!agentId) {
      console.error('❌ Cannot start session: No agent ID provided');
      setSessionState((prev) => ({
        ...prev,
        status: 'error',
        error: 'No agent ID provided',
      }));
      return false;
    }

    try {
      isStartingRef.current = true; // Set guard
      console.log('🚀 Starting voice session with agent:', agentId);
      setSessionState((prev) => ({
        ...prev,
        status: 'connecting',
        error: null,
      }));

      // Fetch conversation token from Eleven Labs API
      const tokenResponse = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(agentId)}`,
        {
          method: 'GET',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
          },
        }
      );

      if (!tokenResponse.ok) {
        throw new Error(
          `Failed to fetch conversation token: ${tokenResponse.status} ${tokenResponse.statusText}`
        );
      }

      const tokenData = await tokenResponse.json();
      const conversationToken = tokenData.token;

      if (!conversationToken) {
        throw new Error('No conversation token received from Eleven Labs');
      }

      console.log('🎫 Got conversation token, starting session...');

      // Start the conversation with the token
      await conversation.startSession({
        conversationToken,
      });

      console.log('✅ Voice session started successfully');
      return true;
    } catch (error) {
      isStartingRef.current = false; // Reset guard on error
      console.error('❌ Failed to start voice session:', error);
      setSessionState((prev) => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to start session',
      }));
      return false;
    }
  }, [agentId, conversation]);

  // End voice session
  const endSession = useCallback(async () => {
    try {
      console.log('🛑 Ending voice session...');
      await conversation.endSession();

      setSessionState({
        status: 'disconnected',
        isSpeaking: false,
        isListening: false,
        error: null,
        conversationId: conversationIdRef.current,
      });

      console.log('✅ Voice session ended');
      return true;
    } catch (error) {
      console.error('❌ Error ending voice session:', error);
      return false;
    }
  }, [conversation]);

  // Track session status and conversation in ref for cleanup
  const sessionStatusRef = useRef(sessionState.status);
  const conversationRef = useRef(conversation);

  useEffect(() => {
    sessionStatusRef.current = sessionState.status;
    conversationRef.current = conversation;
  }, [sessionState.status, conversation]);

  // Cleanup effect: End session on unmount ONLY
  useEffect(() => {
    return () => {
      // Only cleanup if we have an active session
      const currentStatus = sessionStatusRef.current;
      const conv = conversationRef.current;

      if ((currentStatus === 'connected' || currentStatus === 'connecting') && conv) {
        console.log('🧹 useVoiceSession unmounting - cleaning up session');
        conv.endSession().catch((err) => {
          console.error('Error cleaning up session on unmount:', err);
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount/unmount

  return {
    sessionState,
    conversationId: conversationIdRef.current,
    startSession,
    endSession,
    conversation, // Expose raw conversation for advanced usage if needed
  };
};
