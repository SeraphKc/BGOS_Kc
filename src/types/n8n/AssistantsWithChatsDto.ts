import {Assistant} from "../model/Assistant";
import {Chat} from "../model/Chat";

export interface AssistantsWithChatsDto {
    assistants: Assistant[];
    chats: Chat[];
}

export interface AssistantAndChatDto {
    assistant: Assistant;
    chat: Chat;
}