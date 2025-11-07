import { ChatHistory } from '../types/model/ChatHistory';
import { Chat } from '../types/model/Chat';
import { Assistant } from '../types/model/Assistant';

export type ExportFormat = 'markdown' | 'json' | 'txt';

interface ExportMetadata {
    chatTitle: string;
    agentName: string;
    exportDate: string;
    messageCount: number;
}

/**
 * Formats a date string into a readable format
 * Example: "Jan 3, 2025 2:30 PM"
 */
function formatDateTime(dateString: string | undefined): string {
    if (!dateString) return 'Unknown date';

    try {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    } catch {
        return dateString;
    }
}

/**
 * Formats attachments list for export
 */
function formatAttachments(message: ChatHistory): string {
    const attachments: string[] = [];

    // Handle file attachments
    if (message.files && message.files.length > 0) {
        message.files.forEach(file => {
            let type = 'file';
            if (file.isImage) type = 'image';
            else if (file.isVideo) type = 'video';
            else if (file.isAudio) type = 'audio';
            else if (file.isDocument) type = 'document';

            attachments.push(`${file.fileName} (${type})`);
        });
    }

    // Handle standalone audio
    if (message.isAudio && message.audioFileName) {
        attachments.push(`${message.audioFileName} (audio${message.duration ? `, ${Math.round(message.duration)}s` : ''})`);
    }

    return attachments.length > 0 ? attachments.join(', ') : '';
}

/**
 * Export to Markdown format
 */
function exportToMarkdown(messages: ChatHistory[], metadata: ExportMetadata): string {
    let content = `# Chat Export: ${metadata.chatTitle}\n\n`;
    content += `**Agent:** ${metadata.agentName}  \n`;
    content += `**Exported:** ${metadata.exportDate}  \n`;
    content += `**Messages:** ${metadata.messageCount}\n\n`;
    content += `---\n\n`;

    messages.forEach((msg, index) => {
        const sender = msg.sender === 'user' ? 'User' : 'Assistant';
        const timestamp = formatDateTime(msg.sentDate);

        content += `### ${sender} - ${timestamp}\n\n`;

        if (msg.text) {
            content += `${msg.text}\n\n`;
        }

        const attachments = formatAttachments(msg);
        if (attachments) {
            content += `**Attachments:** ${attachments}\n\n`;
        }

        // Add code artifacts
        if (msg.isCode && msg.artifact_code) {
            content += `\`\`\`\n${msg.artifact_code}\n\`\`\`\n\n`;
        }

        // Add article content
        if (msg.isArticle && msg.article_text) {
            content += `> ${msg.article_text}\n\n`;
        }

        // Add separator between messages (except last one)
        if (index < messages.length - 1) {
            content += `---\n\n`;
        }
    });

    return content;
}

/**
 * Export to plain text format
 */
function exportToText(messages: ChatHistory[], metadata: ExportMetadata): string {
    let content = `CHAT EXPORT: ${metadata.chatTitle}\n`;
    content += `Agent: ${metadata.agentName}\n`;
    content += `Exported: ${metadata.exportDate}\n`;
    content += `Messages: ${metadata.messageCount}\n`;
    content += `${'='.repeat(60)}\n\n`;

    messages.forEach((msg, index) => {
        const sender = msg.sender === 'user' ? 'User' : 'Assistant';
        const timestamp = formatDateTime(msg.sentDate);

        content += `[${timestamp}] ${sender}:\n`;

        if (msg.text) {
            content += `${msg.text}\n`;
        }

        const attachments = formatAttachments(msg);
        if (attachments) {
            content += `Attachments: ${attachments}\n`;
        }

        if (msg.isCode && msg.artifact_code) {
            content += `Code:\n${msg.artifact_code}\n`;
        }

        if (msg.isArticle && msg.article_text) {
            content += `Article: ${msg.article_text}\n`;
        }

        content += `\n${'-'.repeat(60)}\n\n`;
    });

    return content;
}

/**
 * Export to JSON format
 */
function exportToJSON(messages: ChatHistory[], metadata: ExportMetadata): string {
    const exportData = {
        metadata: {
            chatTitle: metadata.chatTitle,
            agentName: metadata.agentName,
            exportDate: metadata.exportDate,
            messageCount: metadata.messageCount
        },
        messages: messages.map(msg => ({
            id: msg.id,
            sender: msg.sender,
            timestamp: msg.sentDate,
            text: msg.text,
            attachments: msg.files?.map(f => ({
                fileName: f.fileName,
                mimeType: f.fileMimeType,
                type: f.isImage ? 'image' : f.isVideo ? 'video' : f.isAudio ? 'audio' : f.isDocument ? 'document' : 'file'
            })) || [],
            audio: msg.isAudio ? {
                fileName: msg.audioFileName,
                duration: msg.duration
            } : undefined,
            code: msg.isCode ? msg.artifact_code : undefined,
            article: msg.isArticle ? msg.article_text : undefined,
            hasMultiResponse: msg.is_multi_response
        }))
    };

    return JSON.stringify(exportData, null, 2);
}

/**
 * Main export function
 * Triggers browser download of chat history in the specified format
 */
export function exportChatHistory(
    messages: ChatHistory[],
    chat: Chat,
    assistant: Assistant | undefined,
    format: ExportFormat
): void {
    if (!messages || messages.length === 0) {
        console.warn('No messages to export');
        return;
    }

    const metadata: ExportMetadata = {
        chatTitle: chat.title || 'Untitled Chat',
        agentName: assistant?.name || 'Unknown Agent',
        exportDate: new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }),
        messageCount: messages.length
    };

    let content: string;
    let mimeType: string;
    let extension: string;

    switch (format) {
        case 'markdown':
            content = exportToMarkdown(messages, metadata);
            mimeType = 'text/markdown';
            extension = 'md';
            break;
        case 'json':
            content = exportToJSON(messages, metadata);
            mimeType = 'application/json';
            extension = 'json';
            break;
        case 'txt':
            content = exportToText(messages, metadata);
            mimeType = 'text/plain';
            extension = 'txt';
            break;
        default:
            console.error('Invalid export format');
            return;
    }

    // Create blob and trigger download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // Create filename from chat title (sanitize for filesystem)
    const sanitizedTitle = chat.title
        ?.replace(/[^a-z0-9]/gi, '-')
        .replace(/-+/g, '-')
        .toLowerCase()
        .substring(0, 50) || 'chat-export';

    a.download = `${sanitizedTitle}-${Date.now()}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
