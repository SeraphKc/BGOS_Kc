import { Assistant } from '../types/model/Assistant';
import { mapAssistant } from '../types/AssistantWebhookMap';

export async function createAssistant(userId: string, assistant: Omit<Assistant, 'id' | 'userId'>): Promise<Assistant> {
    const url = `https://n8n-test.brandgrowthos.ai/webhook/b6f845bc-2d9c-43b2-8412-c81871c8bf89/assistants/${userId}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify(assistant),
    });

    if (!response.ok) {
        throw new Error(`Failed to create assistant: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data) {
        return null; // todo проработать ошибку
    }
    
    return mapAssistant(data);
}

export async function updateAssistant(
    userId: string, 
    assistantId: string, 
    assistant: Omit<Assistant, 'id' | 'userId'>
): Promise<Assistant> {
    const url = `https://n8n-test.brandgrowthos.ai/webhook/b6f845bc-2d9c-43b2-8412-c81871c8bf89/assistants/${userId}/${assistantId}`;
    
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify(assistant),
    });

    if (!response.ok) {
        throw new Error(`Failed to update assistant: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data) {
        return null; // todo проработать ошибку
    }
    
    return mapAssistant(data);
}

export async function deleteAssistant(userId: string, assistantId: string): Promise<boolean> {
    const url = `https://n8n-test.brandgrowthos.ai/webhook/b6f845bc-2d9c-43b2-8412-c81871c8bf89/assistants/${userId}/${assistantId}`;
    
    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to delete assistant: ${response.status} ${response.statusText}`);
    }

    return true;
} 