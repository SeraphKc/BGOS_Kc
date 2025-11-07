import { Assistant } from '@bgos/shared-types';
import { apiClient } from './client';
import { mapAssistant } from './mappers';

/**
 * Create a new assistant
 */
export async function createAssistant(
    userId: string,
    assistant: Omit<Assistant, 'id' | 'userId'>
): Promise<Assistant> {
    const response = await apiClient.post(`/assistants/${userId}`, assistant);

    if (!response.data) {
        throw new Error('Failed to create assistant: No data returned');
    }

    return mapAssistant(response.data);
}

/**
 * Update an existing assistant
 */
export async function updateAssistant(
    userId: string,
    assistantId: string,
    assistant: Omit<Assistant, 'id' | 'userId'>
): Promise<Assistant> {
    const response = await apiClient.put(`/assistants/${userId}/${assistantId}`, assistant);

    if (!response.data) {
        throw new Error('Failed to update assistant: No data returned');
    }

    return mapAssistant(response.data);
}

/**
 * Delete an assistant
 */
export async function deleteAssistant(
    userId: string,
    assistantId: string
): Promise<boolean> {
    await apiClient.delete(`/assistants/${userId}/${assistantId}`);
    return true;
}
