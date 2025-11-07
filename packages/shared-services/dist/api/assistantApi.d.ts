import { Assistant } from '@bgos/shared-types';
/**
 * Create a new assistant
 */
export declare function createAssistant(userId: string, assistant: Omit<Assistant, 'id' | 'userId'>): Promise<Assistant>;
/**
 * Update an existing assistant
 */
export declare function updateAssistant(userId: string, assistantId: string, assistant: Omit<Assistant, 'id' | 'userId'>): Promise<Assistant>;
/**
 * Delete an assistant
 */
export declare function deleteAssistant(userId: string, assistantId: string): Promise<boolean>;
