import { ElevenLabsEvents } from '../types/elevenlabs';

/**
 * ElevenLabs WebSocket Event Service
 * Manages WebSocket connection to ElevenLabs Conversational AI for real-time events
 */
export class ElevenLabsEventService {
    private ws: WebSocket | null = null;
    private listeners: Map<ElevenLabsEvents.EventType, Set<(data: any) => void>> = new Map();
    private conversationId: string | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000; // Start with 1 second
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    /**
     * Connect to ElevenLabs WebSocket for a conversation
     */
    connect(conversationId: string): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.warn('WebSocket already connected');
            return;
        }

        this.conversationId = conversationId;
        const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation/${conversationId}/events`;

        console.log('[ElevenLabsEventService] Connecting to WebSocket:', wsUrl);

        try {
            this.ws = new WebSocket(wsUrl);

            // Set up event handlers
            this.ws.onopen = this.handleOpen.bind(this);
            this.ws.onmessage = this.handleMessage.bind(this);
            this.ws.onerror = this.handleError.bind(this);
            this.ws.onclose = this.handleClose.bind(this);
        } catch (error) {
            console.error('[ElevenLabsEventService] Failed to create WebSocket:', error);
            this.emit('error', { type: 'error', message: 'Failed to connect to WebSocket', code: 'CONNECTION_FAILED' });
        }
    }

    /**
     * Disconnect from WebSocket
     */
    disconnect(): void {
        console.log('[ElevenLabsEventService] Disconnecting WebSocket');

        if (this.ws) {
            // Remove event listeners to prevent reconnection
            this.ws.onclose = null;
            this.ws.onerror = null;
            this.ws.onmessage = null;
            this.ws.onopen = null;

            if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
                this.ws.close();
            }

            this.ws = null;
        }

        this.conversationId = null;
        this.reconnectAttempts = 0;
    }

    /**
     * Register an event listener
     */
    on<T extends ElevenLabsEvents.EventType>(
        eventType: T,
        callback: (data: Extract<ElevenLabsEvents.WebSocketEvent, { type: T }>) => void
    ): void {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        this.listeners.get(eventType)!.add(callback);
    }

    /**
     * Remove an event listener
     */
    off<T extends ElevenLabsEvents.EventType>(
        eventType: T,
        callback: (data: Extract<ElevenLabsEvents.WebSocketEvent, { type: T }>) => void
    ): void {
        const callbacks = this.listeners.get(eventType);
        if (callbacks) {
            callbacks.delete(callback);
        }
    }

    /**
     * Remove all listeners for an event type
     */
    removeAllListeners(eventType?: ElevenLabsEvents.EventType): void {
        if (eventType) {
            this.listeners.delete(eventType);
        } else {
            this.listeners.clear();
        }
    }

    /**
     * Emit an event to all registered listeners
     */
    private emit(eventType: ElevenLabsEvents.EventType, data: any): void {
        const callbacks = this.listeners.get(eventType);
        if (callbacks && callbacks.size > 0) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[ElevenLabsEventService] Error in ${eventType} callback:`, error);
                }
            });
        }
    }

    /**
     * Handle WebSocket open event
     */
    private handleOpen(): void {
        console.log('[ElevenLabsEventService] WebSocket connected');
        this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        this.reconnectDelay = 1000; // Reset delay
    }

    /**
     * Handle incoming WebSocket messages
     */
    private handleMessage(event: MessageEvent): void {
        try {
            const data = JSON.parse(event.data) as ElevenLabsEvents.WebSocketEvent;

            console.log('[ElevenLabsEventService] Received event:', data.type, data);

            // Emit the event to registered listeners
            this.emit(data.type, data);

            // Also emit to a generic 'message' listener if needed
            this.emit('ping' as any, data); // Using 'ping' as a hack for 'any message' listener
        } catch (error) {
            console.error('[ElevenLabsEventService] Failed to parse message:', error, event.data);
            this.emit('error', {
                type: 'error',
                message: 'Failed to parse WebSocket message',
                code: 'PARSE_ERROR'
            });
        }
    }

    /**
     * Handle WebSocket errors
     */
    private handleError(error: Event): void {
        console.error('[ElevenLabsEventService] WebSocket error:', error);
        this.emit('error', {
            type: 'error',
            message: 'WebSocket connection error',
            code: 'WEBSOCKET_ERROR'
        });
    }

    /**
     * Handle WebSocket close event
     */
    private handleClose(event: CloseEvent): void {
        console.log('[ElevenLabsEventService] WebSocket closed:', event.code, event.reason);

        // Attempt to reconnect if it wasn't a normal closure
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts && this.conversationId) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

            console.log(`[ElevenLabsEventService] Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

            setTimeout(() => {
                if (this.conversationId) {
                    this.connect(this.conversationId);
                }
            }, delay);
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[ElevenLabsEventService] Max reconnect attempts reached');
            this.emit('error', {
                type: 'error',
                message: 'Failed to reconnect to WebSocket',
                code: 'MAX_RECONNECT_ATTEMPTS'
            });
        }
    }

    /**
     * Get connection status
     */
    get isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }

    /**
     * Get connection state
     */
    get connectionState(): 'connecting' | 'open' | 'closing' | 'closed' {
        if (!this.ws) return 'closed';

        switch (this.ws.readyState) {
            case WebSocket.CONNECTING: return 'connecting';
            case WebSocket.OPEN: return 'open';
            case WebSocket.CLOSING: return 'closing';
            case WebSocket.CLOSED: return 'closed';
            default: return 'closed';
        }
    }
}
