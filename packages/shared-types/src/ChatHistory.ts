import type { InlineKeyboardMarkup } from './InlineKeyboard';

export type Sender = 'user' | 'assistant';

export type MessageStatus = 'sending' | 'queued' | 'sent' | 'delivered' | 'failed';

export type FileInfo = {
    fileName: string;
    fileData: string;
    fileMimeType: string;
    isVideo?: boolean;
    isImage?: boolean;
    isDocument?: boolean;
    isAudio?: boolean;
};

export type ChatHistory = {
    id?: string;
    chatId?: string;
    sender?: Sender;
    sentDate?: string;
    text?: string;
    hasAttachment?: boolean;
    audioFileName?: string;
    audioData?: string;
    audioMimeType?: string;
    isAudio?: boolean;
    duration?: number; // Duration in seconds for audio messages
    artifact_code?: string;
    isCode?: boolean;
    isArticle?: boolean;
    article_text?: string;
    is_multi_response?: boolean;
    files?: FileInfo[];
    isMixedAttachments?:boolean;
    status?: MessageStatus; // Message delivery status for queuing system
    reply_markup?: InlineKeyboardMarkup; // Interactive inline keyboard attached to message
};
