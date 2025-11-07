export interface WebhookResponse {
    type?: 'text' | 'audio';
    data?: string;
    error?: string;
}