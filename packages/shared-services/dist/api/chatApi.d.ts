/**
 * Rename a chat
 */
export declare function renameChat(userId: string, chatId: string, newTitle: string): Promise<boolean>;
/**
 * Delete a chat
 */
export declare function deleteChat(userId: string, chatId: string): Promise<boolean>;
/**
 * Fetch chat name
 */
export declare function fetchChatName(userId: string, chatId: string): Promise<string | null>;
/**
 * Assign scheduled chat
 */
export declare function assignScheduledChat(userId: string, chatId: string, subject: string, period: number, code: string): Promise<boolean>;
