declare module '@elevenlabs/react' {
    export type Role = 'user' | 'agent';
    export type Status = 'connected' | 'connecting' | 'disconnected';

    export interface ConversationOptions {
        apiKey?: string;
        agentId: string;
        onConnect?: () => void;
        onMessage?: (props: { message: string; source: Role }) => void;
        onError?: (error: any) => void;
        onDisconnect?: () => void;
        onModeChange?: (mode: 'listening' | 'speaking') => void;
        onStatusChange?: (status: Status) => void;
        onDebug?: (event: any) => void;
        onUnhandledClientToolCall?: (toolCall: any) => void;
    }

    export interface ConversationHook {
        startSession: (options?: any) => Promise<string>;
        endSession: () => Promise<void>;
        setVolume: (options: { volume: number }) => void;
        getInputByteFrequencyData: () => Uint8Array;
        isSpeaking: boolean;
        status: Status;
        // Text input methods
        sendUserMessage: (text: string) => void;
        sendContextualUpdate: (text: string) => void;
        sendUserActivity: () => void;
    }

    export function useConversation(options: ConversationOptions): ConversationHook;
}

// ElevenLabs WebSocket Event Types
export namespace ElevenLabsEvents {
    export type EventType =
        | 'tool_called'
        | 'tool_completed'
        | 'tool_error'
        | 'transcription'
        | 'agent_response'
        | 'agent_response_part'
        | 'conversation_initiation_metadata'
        | 'user_transcript'
        | 'agent_transcript'
        | 'interruption'
        | 'ping'
        | 'error';

    export interface BaseEvent {
        type: EventType;
        timestamp?: string;
    }

    export interface ToolCallEvent extends BaseEvent {
        type: 'tool_called';
        tool_call_id: string;
        tool_name: string;
        tool_input: any;
        status: 'pending';
    }

    export interface ToolCompletedEvent extends BaseEvent {
        type: 'tool_completed';
        tool_call_id: string;
        tool_name: string;
        tool_output: any;
        status: 'completed';
    }

    export interface ToolErrorEvent extends BaseEvent {
        type: 'tool_error';
        tool_call_id: string;
        tool_name: string;
        error: string;
        status: 'error';
    }

    export interface TranscriptionEvent extends BaseEvent {
        type: 'transcription' | 'user_transcript';
        text: string;
        is_final: boolean;
        role: 'user';
    }

    export interface AgentResponseEvent extends BaseEvent {
        type: 'agent_response';
        text: string;
        role: 'agent';
    }

    export interface AgentResponsePartEvent extends BaseEvent {
        type: 'agent_response_part';
        text: string;
        role: 'agent';
        is_final: boolean;
    }

    export interface ConversationInitiationEvent extends BaseEvent {
        type: 'conversation_initiation_metadata';
        conversation_id: string;
        agent_id: string;
    }

    export interface InterruptionEvent extends BaseEvent {
        type: 'interruption';
    }

    export interface PingEvent extends BaseEvent {
        type: 'ping';
    }

    export interface ErrorEvent extends BaseEvent {
        type: 'error';
        message: string;
        code?: string;
    }

    export type WebSocketEvent =
        | ToolCallEvent
        | ToolCompletedEvent
        | ToolErrorEvent
        | TranscriptionEvent
        | AgentResponseEvent
        | AgentResponsePartEvent
        | ConversationInitiationEvent
        | InterruptionEvent
        | PingEvent
        | ErrorEvent;
} 