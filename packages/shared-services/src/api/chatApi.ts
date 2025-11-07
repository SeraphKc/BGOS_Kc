import { apiClient } from './client';

/**
 * Rename a chat
 */
export async function renameChat(
    userId: string,
    chatId: string,
    newTitle: string
): Promise<boolean> {
    await apiClient.patch(`/chats/${userId}/${chatId}`, { title: newTitle });
    return true;
}

/**
 * Delete a chat
 */
export async function deleteChat(
    userId: string,
    chatId: string
): Promise<boolean> {
    await apiClient.delete(`/chats/${userId}/${chatId}`);
    return true;
}

/**
 * Fetch chat name
 */
export async function fetchChatName(
    userId: string,
    chatId: string
): Promise<string | null> {
    const response = await apiClient.get(`/chat-name/${userId}/${chatId}`);

    if (!response.data?.name) {
        return null;
    }

    return response.data.name;
}

/**
 * Assign scheduled chat
 */
export async function assignScheduledChat(
    userId: string,
    chatId: string,
    subject: string,
    period: number,
    code: string
): Promise<boolean> {
    await apiClient.post(`/assign-scheduled/${userId}/${chatId}`, {
        subject,
        period,
        code,
    });

    return true;
}
