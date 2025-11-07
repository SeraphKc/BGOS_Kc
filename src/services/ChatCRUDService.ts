
export async function renameChat(
    userId: string, 
    chatId: string, 
    newTitle: string
): Promise<boolean> {
    const url = `https://n8n-test.brandgrowthos.ai/webhook/b6f845bc-2d9c-43b2-8412-c81871c8bf89/chats/${userId}/${chatId}`;
    
    const response = await fetch(url, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({ title: newTitle }),
    });

    if (!response.ok) {
        throw new Error(`Failed to rename chat: ${response.status} ${response.statusText}`);
    }

    return true;
}

export async function deleteChat(userId: string, chatId: string): Promise<boolean> {
    const url = `https://n8n-test.brandgrowthos.ai/webhook/b6f845bc-2d9c-43b2-8412-c81871c8bf89/chats/${userId}/${chatId}`;
    
    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to delete chat: ${response.status} ${response.statusText}`);
    }

    return true;
}

export async function fetchChatName(userId: string, chatId: string): Promise<string | null> {
    
    const url = `https://n8n-test.brandgrowthos.ai/webhook/b6f845bc-2d9c-43b2-8412-c81871c8bf89/chat-name/${userId}/${chatId}`;
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch chat name: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data?.name) {
        return null;
    }

    return data.name;
} 

export async function assignScheduledChat(
    userId: string, 
    chatId: string, 
    subject: string,
    period: number,
    code: string
): Promise<boolean> {
    const url = `https://n8n-test.brandgrowthos.ai/webhook/b6f845bc-2d9c-43b2-8412-c81871c8bf89/assign-scheduled/${userId}/${chatId}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({ subject, period, code }),
    });

    if (!response.ok) {
        throw new Error(`Failed to assign scheduled chat: ${response.status} ${response.statusText}`);
    }

    return true;
} 