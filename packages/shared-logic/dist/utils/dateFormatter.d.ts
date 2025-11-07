/**
 * Formats a timestamp into a relative time string like "Last message 2 hours ago"
 * Since we don't have lastMessageDate, we'll use the chat ID as a proxy
 */
export declare function getRelativeTimeFromChatId(chatId: string): string;
export declare function getRelativeTime(timestamp: number): string;
