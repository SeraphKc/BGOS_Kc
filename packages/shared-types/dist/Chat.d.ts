export type Chat = {
    id: string;
    assistantId: string;
    title: string;
    unread: number;
    feedbackPeriod?: Date;
    isStarred?: boolean;
    starOrder?: number;
    lastMessageDate?: string;
    createdAt?: string;
};
