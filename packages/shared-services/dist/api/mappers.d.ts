import { Assistant, Chat, ChatHistory } from '@bgos/shared-types';
export interface AssistantWebhookMap {
    [assistantCode: string]: string;
}
export declare function mapAssistant(assistant: any): Assistant;
export declare function mapChat(chat: any): Chat;
export declare function mapChatHistory(chatHistory: any): ChatHistory;
