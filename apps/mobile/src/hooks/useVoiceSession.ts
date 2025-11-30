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
  disconnectReason: 'user' | 'agent' | 'error' | 'unknown' | null;
  // Tool call tracking
  pendingToolCalls: ToolCallInfo[];
  lastToolEvent: ToolEvent | null;
}

export interface TranscriptMessage {
  id: string;
  message: string;
  source: 'user' | 'agent';
  timestamp: Date;
}

// Tool call tracking for full tool support
export interface ToolCallInfo {
  tool_call_id: string;
  tool_name: string;
  parameters: any;
  status: 'pending' | 'completed' | 'error';
  timestamp: Date;
}

export interface ToolEvent {
  type: 'request' | 'response' | 'client_call' | 'mcp';
  tool_name: string;
  data: any;
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
    disconnectReason: null,
    pendingToolCalls: [],
    lastToolEvent: null,
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

    onDisconnect: useCallback((details?: { reason?: string }) => {
      const reason = (details?.reason as 'user' | 'agent' | 'error') || 'unknown';
      console.log('🔌 Voice session disconnected, reason:', reason);
      setSessionState((prev) => ({
        ...prev,
        status: 'disconnected',
        disconnectReason: reason,
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

    // Track connection status changes - fires when agent ends call
    onStatusChange: useCallback(({ status }: { status: string }) => {
      console.log('📡 Voice connection status changed:', status);

      // When status changes to disconnected/disconnecting, update state
      if (status === 'disconnected' || status === 'disconnecting') {
        setSessionState((prev) => ({
          ...prev,
          status: 'disconnected',
          isSpeaking: false,
          isListening: false,
        }));
      }
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

    // ============ TOOL CALLBACKS - Full Tool Support ============

    // 1. Tool Request - fires when agent STARTS using a tool
    onAgentToolRequest: useCallback((request: any) => {
      console.log('🔧 Agent tool REQUEST:', JSON.stringify(request, null, 2));

      // Track pending tool
      setSessionState((prev) => ({
        ...prev,
        pendingToolCalls: [...prev.pendingToolCalls, {
          tool_call_id: request.tool_call_id || `tool-${Date.now()}`,
          tool_name: request.tool_name,
          parameters: request.parameters,
          status: 'pending',
          timestamp: new Date(),
        }],
        lastToolEvent: {
          type: 'request',
          tool_name: request.tool_name,
          data: request,
          timestamp: new Date(),
        },
      }));

      // Handle end_call immediately when request comes in
      if (request.tool_name === 'end_call') {
        console.log('📞 Agent initiating end_call tool');
      }
    }, []),

    // 2. Tool Response - fires when tool execution completes
    onAgentToolResponse: useCallback((response: any) => {
      console.log('🔧 Agent tool RESPONSE:', JSON.stringify(response, null, 2));

      // Update tool status to completed
      setSessionState((prev) => ({
        ...prev,
        pendingToolCalls: prev.pendingToolCalls.map((tc) =>
          tc.tool_call_id === response.tool_call_id
            ? { ...tc, status: 'completed' as const }
            : tc
        ),
        lastToolEvent: {
          type: 'response',
          tool_name: response.tool_name,
          data: response,
          timestamp: new Date(),
        },
      }));

      // Detect agent ending the call via end_call tool
      if (response.tool_name === 'end_call') {
        console.log('📞 end_call completed - triggering disconnect with reason: agent');
        setSessionState((prev) => ({
          ...prev,
          status: 'disconnected',
          disconnectReason: 'agent',
          isSpeaking: false,
          isListening: false,
          isThinking: false,
          mode: 'idle',
        }));
      }
    }, []),

    // 3. Client Tool Call - for tools the agent invokes that we must handle
    onUnhandledClientToolCall: useCallback((toolCall: any) => {
      console.log('🛠️ Client tool call:', JSON.stringify(toolCall, null, 2));

      setSessionState((prev) => ({
        ...prev,
        lastToolEvent: {
          type: 'client_call',
          tool_name: toolCall.tool_name,
          data: toolCall,
          timestamp: new Date(),
        },
      }));

      // TODO: Handle specific client tools here and return response to agent
      // Example: if (toolCall.tool_name === 'navigate') { ... toolCall.respond({ success: true }); }
    }, []),

    // 4. MCP Tool Call - Model Context Protocol tools
    onMCPToolCall: useCallback((mcpCall: any) => {
      console.log('🔌 MCP tool call:', JSON.stringify(mcpCall, null, 2));

      setSessionState((prev) => ({
        ...prev,
        lastToolEvent: {
          type: 'mcp',
          tool_name: mcpCall.tool_name,
          data: mcpCall,
          timestamp: new Date(),
        },
      }));
    }, []),

    // 5. Debug Events - for troubleshooting all SDK events
    onDebug: useCallback((event: any) => {
      // Log ALL debug events to help diagnose tool issues
      console.log('🐛 DEBUG:', event.type || 'unknown', JSON.stringify(event, null, 2));
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
      // CRITICAL: Enable all tool events in clientEvents to receive tool call information
      await conversationRef.current.startSession({
        conversationToken,
        ...(dynamicVariables && { dynamicVariables }),
        overrides: {
          conversation: {
            // Enable all necessary client events for full tool support
            clientEvents: [
              // Core conversation events
              'agent_response',
              'agent_response_correction',
              'user_transcript',
              'interruption',
              'vad_score',
              // Tool events - CRITICAL for detecting end_call and other tools
              'agent_tool_request',   // When agent STARTS using a tool
              'agent_tool_response',  // When tool execution completes
              'client_tool_call',     // For client-side tools
              'mcp_tool_call',        // For MCP tools
            ],
          },
        },
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
    // Tool state exports
    pendingToolCalls: sessionState.pendingToolCalls,
    lastToolEvent: sessionState.lastToolEvent,
  };
};
