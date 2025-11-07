export function mapAssistant(assistant) {
    return {
        id: assistant.id,
        userId: assistant.user_id,
        name: assistant.name,
        subtitle: assistant.subtitle,
        avatarUrl: assistant.avatar_url,
        webhookUrl: assistant.webhook,
        s2sToken: assistant.s2s_token || '',
        code: assistant.code,
    };
}
export function mapChat(chat) {
    return {
        id: chat.id,
        assistantId: chat.assistant_id,
        title: chat.title,
        unread: Number(chat.unread),
        feedbackPeriod: chat.feedback_period ? new Date(chat.feedback_period) : undefined,
    };
}
export function mapChatHistory(chatHistory) {
    return {
        id: chatHistory.id,
        chatId: chatHistory.chat_id,
        sender: chatHistory.sender,
        sentDate: chatHistory.sent_date,
        text: chatHistory.text,
        hasAttachment: chatHistory.has_attachment,
        duration: chatHistory.duration ?? undefined,
        artifact_code: chatHistory.artifact_code ?? undefined,
        isCode: chatHistory.is_code ?? false,
        isArticle: chatHistory.is_article ?? false,
        article_text: chatHistory.article_text ?? undefined,
        is_multi_response: chatHistory.is_multi_response,
        files: chatHistory.files,
        audioData: chatHistory.audio_data ?? undefined,
        audioFileName: chatHistory.audio_file_name ?? undefined,
        audioMimeType: chatHistory.audio_mime_type ?? undefined,
        isAudio: chatHistory.is_audio ?? false,
        isMixedAttachments: chatHistory.isMixedAttachments,
    };
}
