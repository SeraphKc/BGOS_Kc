export type Assistant = {
    id: string;
    userId: string;
    name: string;
    subtitle: string;
    avatarUrl: string;
    webhookUrl: string;
    s2sToken: string;
    code: string;
    isStarred?: boolean;
    starOrder?: number;
};

