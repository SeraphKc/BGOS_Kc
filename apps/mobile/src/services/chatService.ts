import { Chat } from '@bgos/shared-types';

const BASE_URL = 'https://n8n-test.brandgrowthos.ai/webhook/b6f845bc-2d9c-43b2-8412-c81871c8bf89';

export interface CreateChatParams {
  userId: string;
  chatFirstMessage: string;
  assistantId: string;
  token?: string;
}

export interface FetchChatsParams {
  userId: string;
  token?: string;
}

/**
 * Maps backend snake_case chat response to camelCase Chat object
 */
function mapChatFromBackend(data: any): Chat {
  return {
    id: data.id,
    assistantId: data.assistant_id || data.assistantId,
    title: data.title,
    unread: data.unread || 0,
    feedbackPeriod: data.feedback_period || data.feedbackPeriod,
    isStarred: data.is_starred || data.isStarred || false,
    starOrder: data.star_order || data.starOrder,
  };
}

/**
 * Creates a new chat on the backend
 * The backend will generate a chat ID, title, and save to database
 *
 * @param params - CreateChatParams containing userId, chatFirstMessage, and assistantId
 * @returns Promise<Chat> - The created chat with backend-generated ID and title
 * @throws Error if backend request fails or returns invalid data
 */
export async function createChat(params: CreateChatParams): Promise<Chat> {
  const { userId, chatFirstMessage, assistantId, token } = params;

  console.log('Creating new chat on backend:', {
    userId,
    assistantId,
    messagePreview: chatFirstMessage.substring(0, 50),
  });

  try {
    // Call backend API to create chat
    const url = `${BASE_URL}/${userId}/chats`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        chatFirstMessage,
        assistantId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend chat creation failed:', response.status, errorText);
      throw new Error(`Failed to create chat: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('Backend chat creation response:', responseData);

    // Handle array response (backend might return array)
    let chatData;
    if (Array.isArray(responseData) && responseData.length > 0) {
      chatData = responseData[0];
    } else if (responseData && typeof responseData === 'object' && responseData.id) {
      chatData = responseData;
    } else {
      console.error('Invalid response from backend:', responseData);
      throw new Error('Invalid response from server: No chat data returned');
    }

    // Validate required fields
    if (!chatData.id) {
      console.error('Backend did not return chat ID:', chatData);
      throw new Error('Backend did not return chat ID');
    }

    // Map to Chat type
    const newChat = mapChatFromBackend(chatData);

    console.log('Successfully created chat:', {
      id: newChat.id,
      title: newChat.title,
      assistantId: newChat.assistantId,
    });

    return newChat;

  } catch (error: any) {
    console.error('Error creating chat on backend:', error);
    throw new Error(`Failed to create chat: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Fetches all chats for a user from the backend
 * Used to refresh the chat list after operations like chat creation
 *
 * @param params - FetchChatsParams containing userId and optional token
 * @returns Promise<Chat[]> - Array of chats for the user
 * @throws Error if backend request fails
 */
export async function fetchChats(params: FetchChatsParams): Promise<Chat[]> {
  const { userId, token } = params;

  console.log('Fetching chats from backend for user:', userId);

  try {
    const url = `${BASE_URL}/${userId}/chats`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend fetch chats failed:', response.status, errorText);
      throw new Error(`Failed to fetch chats: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('Backend fetch chats response:', `${responseData.length} chats received`);

    // Map all chats from backend format
    const chats = Array.isArray(responseData)
      ? responseData.map(mapChatFromBackend)
      : [];

    return chats;

  } catch (error: any) {
    console.error('Error fetching chats from backend:', error);
    throw new Error(`Failed to fetch chats: ${error.message || 'Unknown error'}`);
  }
}
