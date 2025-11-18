import { ChatHistory, FileInfo } from '@bgos/shared-types';
import ReactNativeBlobUtil from 'react-native-blob-util';

export interface SendMessageParams {
  userId: string;
  assistantWebhookUrl: string;
  chatId: string;
  text: string;
  files?: FileInfo[];
  audioData?: string;
  audioFileName?: string;
  audioMimeType?: string;
  audioFilePath?: string; // NEW: File path for binary upload
  duration?: number;
}

interface WebhookResponse {
  type: 'text' | 'audio';
  data: string;
  contentType?: string;
  audioFileName?: string;
  error?: string;
}

/**
 * Maps the server response to ChatHistory format
 * Handles snake_case to camelCase conversion
 */
function mapChatHistoryFromServer(data: any): ChatHistory {
  return {
    id: data.id || `server-${Date.now()}`,
    chatId: data.chat_id || data.chatId,
    sender: data.sender as 'user' | 'assistant',
    sentDate: data.sent_date || data.sentDate || new Date().toISOString(),
    text: data.text || '',
    hasAttachment: data.has_attachment || data.hasAttachment || false,
    duration: data.duration,
    artifact_code: data.artifact_code || data.artifactCode,
    isCode: data.is_code || data.isCode || false,
    isArticle: data.is_article || data.isArticle || false,
    article_text: data.article_text || data.articleText,
    is_multi_response: data.is_multi_response || data.isMultiResponse || false,
    files: data.files?.map((file: any) => ({
      fileName: file.file_name || file.fileName,
      fileData: file.file_data || file.fileData,
      fileMimeType: file.file_mime_type || file.fileMimeType,
      isVideo: file.is_video || file.isVideo || false,
      isImage: file.is_image || file.isImage || false,
      isDocument: file.is_document || file.isDocument || false,
      isAudio: file.is_audio || file.isAudio || false,
    })),
    isAudio: data.is_audio || data.isAudio || false,
    isMixedAttachments: data.is_mixed_attachments || data.isMixedAttachments || false,
    audioData: data.audio_data || data.audioData,
    audioFileName: data.audio_file_name || data.audioFileName,
    audioMimeType: data.audio_mime_type || data.audioMimeType,
  };
}

/**
 * Sends a message to the N8n webhook endpoint
 * Replicates the desktop app implementation from useWebhoock.ts
 */
export async function sendMessageToWebhook(params: SendMessageParams): Promise<ChatHistory> {
  const {
    userId,
    assistantWebhookUrl,
    chatId,
    text,
    files,
    audioData,
    audioFileName,
    audioMimeType,
    duration,
  } = params;

  // CRITICAL VALIDATION: chatId must be a valid UUID, not 'new'
  if (!chatId || chatId === 'new') {
    const errorMsg = 'Cannot send message: Invalid chatId. Chat must be created on backend first.';
    console.error(errorMsg, { chatId });
    throw new Error(errorMsg);
  }

  // Construct webhook URL: {assistantWebhook}/{userId}
  const webhookUrl = `${assistantWebhookUrl}/${userId}`;

  console.log('Sending message to webhook:', webhookUrl);
  console.log('Chat ID:', chatId);

  try {
    // Create FormData for the request
    const formData = new FormData();

    // Determine if this is an audio message
    const isAudio = !!audioData;
    const hasAttachment = !!(files && files.length > 0);

    // Basic message fields (matching desktop app structure)
    formData.append('chatId', chatId);
    formData.append('sender', 'user');
    formData.append('sentDate', new Date().toISOString());
    formData.append('text', text);
    formData.append('isAudio', String(isAudio));
    formData.append('hasAttachment', String(hasAttachment));

    // Audio fields (if voice message)
    if (isAudio && audioData && audioFileName && audioMimeType) {
      formData.append('audioFileName', audioFileName);
      formData.append('audioData', audioData); // Base64 string (for database storage)
      formData.append('audioMimeType', audioMimeType);
      formData.append('duration', String(duration || 0)); // Always send duration (matching desktop)
      formData.append('isMixedAttachments', 'false'); // Voice-only messages have no mixed attachments

      // Upload audio file as binary (matching desktop implementation)
      // IMPORTANT: Store file info for later processing, don't add to FormData yet
      // We'll handle this specially in the multipart array building step
    }

    // File attachment fields
    if (hasAttachment && files && files.length > 0) {
      formData.append('files', JSON.stringify(files));

      // Check if it's mixed attachments (multiple file types)
      const hasImages = files.some(f => f.isImage);
      const hasVideos = files.some(f => f.isVideo);
      const hasDocuments = files.some(f => f.isDocument);
      const hasAudios = files.some(f => f.isAudio);

      const typeCount = [hasImages, hasVideos, hasDocuments, hasAudios].filter(Boolean).length;
      const isMixedAttachments = typeCount > 1;

      formData.append('isMixedAttachments', String(isMixedAttachments));
      formData.append('isImage', String(hasImages && !isMixedAttachments));
      formData.append('isVideo', String(hasVideos && !isMixedAttachments));
      formData.append('isDocument', String(hasDocuments && !isMixedAttachments));
    }

    // Use standard fetch for all messages (text and voice)
    // Voice messages already have base64 audio data in the audioData field
    console.log(isAudio ? 'Voice message - using standard fetch with base64 audio' : 'Text message - using standard fetch');

    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type - let React Native set it with boundary
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    const responseText = await response.text();

    console.log('Webhook response received, content-type:', contentType);
    console.log('Response text length:', responseText.length);

    try {
      const jsonData = JSON.parse(responseText);
      console.log('Parsed JSON data:', jsonData);
      const mappedData = mapChatHistoryFromServer(jsonData);
      console.log('Mapped chat history:', mappedData);
      return mappedData;
    } catch (parseError) {
      console.error('Error parsing webhook response:', parseError);
      console.log('Raw response:', responseText);

      // Return error message
      return {
        id: `error-${Date.now()}`,
        chatId,
        sender: 'assistant',
        sentDate: new Date().toISOString(),
        text: responseText || 'Error: Invalid response from server',
        hasAttachment: false,
        isAudio: false,
      };
    }
  } catch (error: any) {
    console.error('Webhook request error:', error);

    // Return error message to display in chat
    return {
      id: `error-${Date.now()}`,
      chatId,
      sender: 'assistant',
      sentDate: new Date().toISOString(),
      text: `Error: ${error.message || 'Failed to send message'}`,
      hasAttachment: false,
      isAudio: false,
    };
  }
}
