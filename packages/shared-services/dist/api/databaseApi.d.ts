import { Assistant, Chat, ChatHistory } from '@bgos/shared-types';
export interface AssistantsWithChatsDto {
    assistants: Assistant[];
    chats: Chat[];
}
/**
 * Fetch all assistants and chats for a user
 */
export declare function fetchAssistantsWithChats(userId: string, token: string): Promise<AssistantsWithChatsDto>;
/**
 * Fetch chat history for a specific chat
 */
export declare function fetchChatHistory(userId: string, chatId: string, token: string): Promise<ChatHistory[]>;
/**
 * Add a new chat
 */
export declare function addChat(userId: string, chatFirstMessage: string, assistantId: string, token: string): Promise<Chat>;
