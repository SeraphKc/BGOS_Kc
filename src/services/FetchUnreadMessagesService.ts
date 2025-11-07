export type UnreadMessagesMap = Record<string, number>;

const UNREAD_MESSAGES_API_URL = 'https://n8n-test.brandgrowthos.ai/webhook/b6f845bc-2d9c-43b2-8412-c81871c8bf89/unread-messages';

interface UnreadMessagesResponseItem {
    id: string;
    unread: number;
}

export async function fetchUnreadMessages(userId: string): Promise<UnreadMessagesMap> {
    const url = `${UNREAD_MESSAGES_API_URL}/${userId}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch unread messages: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || !Array.isArray(data.unreadChats) || data.unreadChats.length === 0) {
        return {};
    }

    const map: UnreadMessagesMap = {};
    for (const item of data.unreadChats as UnreadMessagesResponseItem[]) {
        if (item && item.id && typeof item.unread === 'number') {
            map[item.id] = item.unread;
        }
    }

    return map;
}