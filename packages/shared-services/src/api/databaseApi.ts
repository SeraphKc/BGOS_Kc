import { Assistant, Chat, ChatHistory } from '@bgos/shared-types';
import { apiClient } from './client';
import { mapAssistant, mapChat, mapChatHistory } from './mappers';

export interface AssistantsWithChatsDto {
    assistants: Assistant[];
    chats: Chat[];
}

/**
 * Fetch all assistants and chats for a user
 */
export async function fetchAssistantsWithChats(
    userId: string,
    token: string
): Promise<AssistantsWithChatsDto> {
    const response = await apiClient.get(`/assistants-with-chats/${userId}`);

    const assistants = response.data?.assistants?.map(mapAssistant) ?? [];
    const chats = response.data?.chats?.map(mapChat) ?? [];

    return { assistants, chats };
}

/**
 * Fetch chat history for a specific chat
 */
export async function fetchChatHistory(
    userId: string,
    chatId: string,
    token: string
): Promise<ChatHistory[]> {
    const response = await apiClient.get(`/chat-history/${userId}/${chatId}`);

    return response.data?.chatHistory?.map(mapChatHistory) ?? [];
}

/**
 * Add a new chat
 */
export async function addChat(
    userId: string,
    chatFirstMessage: string,
    assistantId: string,
    token: string
): Promise<Chat> {
    const response = await apiClient.post(`/${userId}/chats`, {
        chatFirstMessage,
        assistantId,
    });

    // Handle array response
    if (Array.isArray(response.data) && response.data.length > 0) {
        return mapChat(response.data[0]);
    }

    // Handle single chat object response
    if (response.data && typeof response.data === 'object' && response.data.id) {
        return mapChat(response.data);
    }

    // Handle invalid response
    throw new Error('Invalid response from server: No chat data returned');
}
