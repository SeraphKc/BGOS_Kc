export type Chat = {
    id: string;
    assistantId: string;
    title: string;
    unread: number;
    feedbackPeriod?: Date;
    isStarred?: boolean;
    starOrder?: number;
    lastMessageDate?: string;  // ISO timestamp of the last message
    createdAt?: string;        // ISO timestamp of chat creation
};
