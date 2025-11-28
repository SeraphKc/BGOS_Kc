import { useCallback, useRef, useState, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react-native';
import { ELEVENLABS_API_KEY } from '@env';

interface UseVoiceSessionProps {
  agentId: string | undefined;
  dynamicVariables?: Record<string, string | number | boolean>;
}

export interface VoiceSessionState {
  status: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
  isSpeaking: boolean;
  isListening: boolean;
  isThinking: boolean;
  isMuted: boolean;
  mode: 'idle' | 'listening' | 'speaking' | 'thinking';
  error: string | null;
  conversationId: string | null;
  audioLevel: number;
  vadScore: number;
}

export interface TranscriptMessage {
  id: string;
  message: string;
  source: 'user' | 'agent';
  timestamp: Date;
}

export const useVoiceSession = ({ agentId, dynamicVariables }: UseVoiceSessionProps) => {
  const [sessionState, setSessionState] = useState<VoiceSessionState>({
    status: 'idle',
    isSpeaking: false,
    isListening: false,
    isThinking: false,
    isMuted: false,
    mode: 'idle',
    error: null,
    conversationId: null,
    audioLevel: 0,
    vadScore: 0,
  });

  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const conversationIdRef = useRef<string | null>(null);

  // Ref to track last mode for debouncing rapid duplicate mode change events
  const lastModeRef = useRef<string>('idle');

  // Initialize Eleven Labs conversation hook with stable callback references
  // Callbacks must be wrapped in useCallback with empty deps to prevent re-creation
  const conversation = useConversation({
    onConnect: useCallback(({ conversationId }: { conversationId: string }) => {
      console.log('✅ Voice session connected:', conversationId);

      // Store conversation ID
      conversationIdRef.current = conversationId;

      // Use functional setState to avoid external dependencies
      setSessionState((prev) => ({
        ...prev,
        status: 'connected',
        error: null,
        conversationId,
      }));
    }, []),

    onDisconnect: useCallback(() => {
      console.log('🔌 Voice session disconnected');
      setSessionState((prev) => ({
        ...prev,
        status: 'disconnected',
        isSpeaking: false,
        isListening: false,
      }));
    }, []),

    onError: useCallback((message: string, context?: any) => {
      console.error('❌ Voice session error:', message, context);
      setSessionState((prev) => ({
        ...prev,
        status: 'error',
        error: message || 'Unknown error occurred',
        isSpeaking: false,
        isListening: false,
      }));
    }, []),

    onModeChange: useCallback(({ mode }: { mode: 'speaking' | 'listening' | 'thinking' | 'idle' }) => {
      // Skip duplicate mode events to prevent excessive re-renders
      // The SDK fires mode changes very rapidly (multiple per second)
      if (lastModeRef.current === mode) return;
      lastModeRef.current = mode;

      console.log('🎙️ Voice mode changed:', mode);
      setSessionState((prev) => ({
        ...prev,
        mode,
        isSpeaking: mode === 'speaking',
        isListening: mode === 'listening',
        isThinking: mode === 'thinking',
      }));
    }, []),

    onMessage: useCallback((message: any) => {
      console.log('💬 Voice message:', message);

      // Add message to transcript using functional setState
      const newMessage: TranscriptMessage = {
        id: `${Date.now()}-${message.source}`,
        message: message.message,
        source: message.source === 'user' ? 'user' : 'agent',
        timestamp: new Date(),
      };

      setTranscript((prev) => [...prev, newMessage]);
    }, []),

    onAudio: useCallback((audioChunk: string) => {
      // Audio chunk received (base64 encoded)
      // Could be used for custom audio processing or visualization
      console.log('🔊 Audio chunk received:', audioChunk.substring(0, 50));
    }, []),

    onVadScore: useCallback(({ vadScore }: { vadScore: number }) => {
      // Voice Activity Detection score (0-1)
      // Log when VAD detects voice activity (score > 0.1)
      if (vadScore > 0.1) {
        console.log(`🎤 VAD Score: ${vadScore.toFixed(2)} (voice detected)`);
      }
      setSessionState((prev) => ({
        ...prev,
        vadScore,
        audioLevel: vadScore, // Use VAD score as audio level indicator
      }));
    }, []),

    onInterruption: useCallback(() => {
      console.log('⚡ User interrupted agent');
    }, []),

    onAgentChatResponsePart: useCallback((props: any) => {
      // Streaming agent response
      console.log('💬 Agent response part:', props);
    }, []),
  });

  // Store conversation in ref for stable access across renders
  const conversationRef = useRef(conversation);
  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  // Start voice session - no conversation dependency, uses ref for access
  const startSession = useCallback(async () => {
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

      // Start the conversation with the token and optional dynamic variables
      // Access conversation via ref for stability
      await conversationRef.current.startSession({
        conversationToken,
        ...(dynamicVariables && { dynamicVariables }),
      });

      console.log('✅ Voice session started successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to start voice session:', error);
      setSessionState((prev) => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to start session',
      }));
      return false;
    }
  }, [agentId, dynamicVariables]);

  // End voice session - no conversation dependency, uses ref for access
  const endSession = useCallback(async () => {
    try {
      console.log('🛑 Ending voice session...');
      await conversationRef.current.endSession();

      setSessionState((prev) => ({
        ...prev,
        status: 'disconnected',
        isSpeaking: false,
        isListening: false,
        isThinking: false,
        isMuted: false,
        mode: 'idle',
        error: null,
      }));

      console.log('✅ Voice session ended');
      return true;
    } catch (error) {
      console.error('❌ Error ending voice session:', error);
      return false;
    }
  }, []);

  // Toggle mute state
  const toggleMute = useCallback(() => {
    const currentStatus = statusRef.current;
    if (currentStatus !== 'connected') return;

    setSessionState((prev) => {
      const newMutedState = !prev.isMuted;
      console.log(`🎤 Microphone ${newMutedState ? 'muted' : 'unmuted'}`);

      // Use ElevenLabs SDK mute method if available
      try {
        if (conversationRef.current && typeof conversationRef.current.setMuted === 'function') {
          conversationRef.current.setMuted(newMutedState);
        }
      } catch (error) {
        console.error('❌ Error setting mute state:', error);
      }

      return {
        ...prev,
        isMuted: newMutedState,
      };
    });
  }, []);

  // Track status in ref for stable access
  const statusRef = useRef(sessionState.status);
  useEffect(() => {
    statusRef.current = sessionState.status;
  }, [sessionState.status]);

  // NOTE: Automatic cleanup on unmount has been removed to prevent premature disconnections
  // during hot reloads, fast refresh, or component re-renders.
  // Session cleanup should be handled explicitly by calling endSession() or via navigation listeners.

  // Send user activity to prevent agent interruption
  const sendUserActivity = useCallback(() => {
    const currentStatus = statusRef.current;
    if (currentStatus === 'connected') {
      conversationRef.current.sendUserActivity();
      console.log('👆 User activity signal sent');
    }
  }, []);

  // Send contextual update (silent context, no agent response)
  const sendContextualUpdate = useCallback((context: string) => {
    const currentStatus = statusRef.current;
    if (currentStatus === 'connected') {
      conversationRef.current.sendContextualUpdate(context);
      console.log('📝 Contextual update sent:', context);
    }
  }, []);

  return {
    sessionState,
    transcript,
    conversationId: conversationIdRef.current,
    startSession,
    endSession,
    toggleMute,
    sendUserActivity,
    sendContextualUpdate,
  };
};
