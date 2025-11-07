import { apiClient } from './client';
/**
 * Rename a chat
 */
export async function renameChat(userId, chatId, newTitle) {
    await apiClient.patch(`/chats/${userId}/${chatId}`, { title: newTitle });
    return true;
}
/**
 * Delete a chat
 */
export async function deleteChat(userId, chatId) {
    await apiClient.delete(`/chats/${userId}/${chatId}`);
    return true;
}
/**
 * Fetch chat name
 */
export async function fetchChatName(userId, chatId) {
    const response = await apiClient.get(`/chat-name/${userId}/${chatId}`);
    if (!response.data?.name) {
        return null;
    }
    return response.data.name;
}
/**
 * Assign scheduled chat
 */
export async function assignScheduledChat(userId, chatId, subject, period, code) {
    await apiClient.post(`/assign-scheduled/${userId}/${chatId}`, {
        subject,
        period,
        code,
    });
    return true;
}
