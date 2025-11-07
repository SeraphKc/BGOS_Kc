declare module '@11labs/react' {
    export interface ConversationOptions {
        apiKey: string;
        agentId: string;
        onConnect?: () => void;
        onMessage?: (message: any) => void;
        onError?: (error: any) => void;
        onDisconnect?: () => void;
    }

    export interface ConversationHook {
        startSession: (options?: any) => Promise<string>;
        endSession: () => Promise<void>;
        setVolume: ({ volume }: { volume: number }) => void;
        getInputByteFrequencyData: () => Uint8Array;
        isSpeaking: boolean;
    }

    export function useConversation(options: ConversationOptions): ConversationHook;
} 