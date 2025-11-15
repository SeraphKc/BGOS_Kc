import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { ElevenLabsEventService } from '../services/elevenLabsEventService';
import {
    addToolCall,
    updateToolCall,
    clearToolCalls,
    setLiveUserTranscription,
    setLiveAgentTranscription,
    clearLiveTranscription,
    setVoiceError,
} from '@bgos/shared-state/dist/slices/voiceSlice';
import { ElevenLabsEvents } from '../types/elevenlabs';

/**
 * useVoiceWebSocket
 * Custom hook to manage WebSocket connection for ElevenLabs voice events
 * Connects WebSocket events to Redux actions
 */
export const useVoiceWebSocket = (apiKey: string) => {
    const dispatch = useDispatch();
    const serviceRef = useRef<ElevenLabsEventService | null>(null);

    // Initialize service on mount
    useEffect(() => {
        serviceRef.current = new ElevenLabsEventService(apiKey);
        return () => {
            if (serviceRef.current) {
                serviceRef.current.disconnect();
                serviceRef.current.removeAllListeners();
            }
        };
    }, [apiKey]);

    // Connect to WebSocket for a conversation
    const connect = useCallback((conversationId: string) => {
        if (!serviceRef.current) {
            console.error('[useVoiceWebSocket] Service not initialized');
            return;
        }

        console.log('[useVoiceWebSocket] Connecting to conversation:', conversationId);

        // Clear previous data
        dispatch(clearToolCalls());
        dispatch(clearLiveTranscription());

        // Connect to WebSocket
        serviceRef.current.connect(conversationId);

        // Subscribe to tool_called event
        const handleToolCalled = (event: ElevenLabsEvents.ToolCallEvent) => {
            console.log('[useVoiceWebSocket] Tool called:', event);
            dispatch(addToolCall({
                tool_call_id: event.tool_call_id,
                tool_name: event.tool_name,
                tool_input: event.tool_input,
                status: 'pending',
                timestamp: event.timestamp || new Date().toISOString(),
            }));
        };

        // Subscribe to tool_completed event
        const handleToolCompleted = (event: ElevenLabsEvents.ToolCompletedEvent) => {
            console.log('[useVoiceWebSocket] Tool completed:', event);
            dispatch(updateToolCall({
                tool_call_id: event.tool_call_id,
                updates: {
                    tool_output: event.tool_output,
                    status: 'completed',
                },
            }));
        };

        // Subscribe to tool_error event
        const handleToolError = (event: ElevenLabsEvents.ToolErrorEvent) => {
            console.log('[useVoiceWebSocket] Tool error:', event);
            dispatch(updateToolCall({
                tool_call_id: event.tool_call_id,
                updates: {
                    error: event.error,
                    status: 'error',
                },
            }));
        };

        // Subscribe to transcription events (user)
        const handleTranscription = (event: ElevenLabsEvents.TranscriptionEvent) => {
            console.log('[useVoiceWebSocket] User transcription:', event);
            if (event.is_final) {
                dispatch(setLiveUserTranscription(event.text));
            }
        };

        // Subscribe to agent_response events
        const handleAgentResponse = (event: ElevenLabsEvents.AgentResponseEvent) => {
            console.log('[useVoiceWebSocket] Agent response:', event);
            dispatch(setLiveAgentTranscription(event.text));
        };

        // Subscribe to agent_response_part events (streaming)
        const handleAgentResponsePart = (event: ElevenLabsEvents.AgentResponsePartEvent) => {
            console.log('[useVoiceWebSocket] Agent response part:', event);
            if (event.is_final) {
                dispatch(setLiveAgentTranscription(event.text));
            }
        };

        // Subscribe to error events
        const handleError = (event: ElevenLabsEvents.ErrorEvent) => {
            console.error('[useVoiceWebSocket] WebSocket error:', event);
            dispatch(setVoiceError(event.message));
        };

        // Register all event listeners
        serviceRef.current.on('tool_called', handleToolCalled);
        serviceRef.current.on('tool_completed', handleToolCompleted);
        serviceRef.current.on('tool_error', handleToolError);
        serviceRef.current.on('transcription', handleTranscription);
        serviceRef.current.on('user_transcript', handleTranscription);
        serviceRef.current.on('agent_response', handleAgentResponse);
        serviceRef.current.on('agent_response_part', handleAgentResponsePart);
        serviceRef.current.on('error', handleError);

        // Cleanup function
        return () => {
            if (serviceRef.current) {
                serviceRef.current.off('tool_called', handleToolCalled);
                serviceRef.current.off('tool_completed', handleToolCompleted);
                serviceRef.current.off('tool_error', handleToolError);
                serviceRef.current.off('transcription', handleTranscription);
                serviceRef.current.off('user_transcript', handleTranscription);
                serviceRef.current.off('agent_response', handleAgentResponse);
                serviceRef.current.off('agent_response_part', handleAgentResponsePart);
                serviceRef.current.off('error', handleError);
            }
        };
    }, [dispatch]);

    // Disconnect from WebSocket
    const disconnect = useCallback(() => {
        console.log('[useVoiceWebSocket] Disconnecting');
        if (serviceRef.current) {
            serviceRef.current.disconnect();
            serviceRef.current.removeAllListeners();
        }
        // Clear Redux state
        dispatch(clearToolCalls());
        dispatch(clearLiveTranscription());
    }, [dispatch]);

    // Get connection status
    const isConnected = serviceRef.current?.isConnected || false;

    return {
        connect,
        disconnect,
        isConnected,
    };
};
