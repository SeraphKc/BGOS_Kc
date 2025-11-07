import {ChatHistory} from "../types/model/ChatHistory";

export async function saveChatHistory(
    userId: string,
    messages: ChatHistory[]
): Promise<boolean> {
    const url = `https://n8n-test.brandgrowthos.ai/webhook/b6f845bc-2d9c-43b2-8412-c81871c8bf89/chat-history/${userId}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
        throw new Error(`Failed to send messages: ${response.status} ${response.statusText}`);
    }

    return true;
}