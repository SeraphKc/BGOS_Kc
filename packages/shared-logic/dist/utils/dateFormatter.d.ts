import { Chat } from '@bgos/shared-types';
/**
 * Formats a timestamp into a relative time string like "Last message 2 hours ago"
 * Uses the chat's lastMessageDate or createdAt field
 */
export declare function getRelativeTimeFromChat(chat: Chat): string;
export declare function getRelativeTimeFromChatId(chatId: string): string;
/**
 * Compare two chats by their timestamp (most recent first)
 * Used for sorting chat lists
 */
export declare function compareChatsByDate(a: Chat, b: Chat): number;
export declare function getRelativeTime(timestamp: number): string;
