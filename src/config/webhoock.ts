    import {AssistantWebhookMap} from "../types/AssistantWebhookMap";

// fixme временно хардкод кодов ассистентов, не используется этот подход
export const ASSISTANT_WEBHOOKS: AssistantWebhookMap = {
    // ava
    'ava': 'https://n8n-test.brandgrowthos.ai/webhook/e4eeeae4-7f0d-4087-a20b-39f0efbb89d9',

    // erica
    'erica': 'https://seraphkc.app.n8n.cloud/webhook/8a58f4a4-c51a-405d-8611-daee3921a2a8',

    // sales
    'sales': 'https://n8n.brandgrowthos.ai/webhook/sales-uuid-here',

    // opus
    'opus': 'https://n8n.brandgrowthos.ai/webhook/opus-uuid-here',
};

export const getWebhookUrl = (assistantCode: string, userId?: string): string => {
    const webhookUrl = ASSISTANT_WEBHOOKS[assistantCode];
    if (!webhookUrl) {
        throw new Error(`No webhook URL configured for assistant: ${assistantCode}`);
    }
    return webhookUrl + '/' + userId;
};