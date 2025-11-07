export type NotificationType = 'notify' | 'warning' | 'error';
export type Notification = {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    isChecked: boolean;
};
