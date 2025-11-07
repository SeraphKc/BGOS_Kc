import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import {AssistantsWithChatsDto} from "../types/n8n/AssistantsWithChatsDto";
import {Chat} from "../types/model/Chat";
import {ChatHistory} from "../types/model/ChatHistory";
import { mapAssistant, mapChat, mapChatHistory } from '../types/AssistantWebhookMap';

// Всю информацию было решено хранить по userId
export const remoteDatabaseApi = createApi({
    reducerPath: 'remoteDatabaseSyncApi',
    baseQuery: fetchBaseQuery({
        baseUrl: 'https://n8n-test.brandgrowthos.ai/webhook/b6f845bc-2d9c-43b2-8412-c81871c8bf89',
    }),
    endpoints: (builder) => ({
        fetchAssistantsWithChats: builder.query<AssistantsWithChatsDto, { userId: string, token: string }>({
            query: ({userId, token}) => ({
                url: `/assistants-with-chats/${userId}`,
                method: 'GET',
                // headers: { Authorization: `Bearer ${token}` }, // todo для авторизации
            }),
            transformResponse: (response: any): AssistantsWithChatsDto => {
                const assistants = response?.assistants?.map(mapAssistant) ?? [];
                const chats = response?.chats?.map(mapChat) ?? [];
                return { assistants, chats };
            },
        }),

        fetchChatHistory: builder.query<ChatHistory[], { userId: string, chatId: string; token: string }>({
            query: ({userId, chatId, token}) => ({
                url: `/chat-history/${userId}/${chatId}`,
                method: 'GET',
                // headers: { Authorization: `Bearer ${token}` }, // todo для авторизации
            }),
            transformResponse: (response: any): ChatHistory[] => {
                return response?.chatHistory?.map(mapChatHistory) ?? [];
            },
        }),

        addChat: builder.mutation<Chat, {userId: string; chatFirstMessage: string; token: string; assistantId: string }>({
            query: ({userId, chatFirstMessage, token, assistantId}) => ({
                url: `/${userId}/chats`,
                method: 'POST',
                body: {
                    chatFirstMessage,
                    assistantId,
                },
                // headers: { Authorization: `Bearer ${token}` }, // todo для авторизации
            }),
            transformResponse: (response: any) => {
                // Handle array response
                if (Array.isArray(response) && response.length > 0) {
                    return mapChat(response[0]);
                }
                // Handle single chat object response
                if (response && typeof response === 'object' && response.id) {
                    return mapChat(response);
                }
                // Handle null/undefined/invalid response - throw error with helpful message
                throw new Error('Invalid response from server: No chat data returned');
            },
        }),
    }),
});

export const {useFetchAssistantsWithChatsQuery, useFetchChatHistoryQuery, useAddChatMutation} = remoteDatabaseApi;