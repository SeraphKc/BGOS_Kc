import { ChatHistory, FileInfo } from '@bgos/shared-types';

export interface SendMessageParams {
  userId: string;
  assistantWebhookUrl: string;
  chatId: string;
  text: string;
  files?: FileInfo[];
  audioData?: string;
  audioFileName?: string;
  audioMimeType?: string;
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
      formData.append('audioData', audioData); // Base64 string
      formData.append('audioMimeType', audioMimeType);

      if (duration) {
        formData.append('duration', String(duration));
      }

      // Convert base64 to Blob for N8n transcription
      try {
        // Remove data URL prefix if present
        const base64Data = audioData.includes(',') ? audioData.split(',')[1] : audioData;

        // Convert base64 to binary
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const audioBlob = new Blob([bytes], { type: audioMimeType });
        formData.append('audioFile', audioBlob, audioFileName);
      } catch (error) {
        console.error('Error converting audio to blob:', error);
      }
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

    // Send request to webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - let the browser set it with boundary for FormData
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
    }

    // Parse response
    const contentType = response.headers.get('content-type') || '';

    // Handle audio response
    if (contentType.includes('audio/') || contentType.includes('application/octet-stream')) {
      const arrayBuffer = await response.arrayBuffer();
      const base64Audio = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      return {
        id: `audio-response-${Date.now()}`,
        chatId,
        sender: 'assistant',
        sentDate: new Date().toISOString(),
        text: '',
        isAudio: true,
        audioData: base64Audio,
        audioFileName: `audio_response_${Date.now()}.mp3`,
        audioMimeType: contentType.includes('audio/') ? contentType : 'audio/mpeg',
        hasAttachment: false,
      };
    }

    // Handle text/JSON response
    const responseText = await response.text();
    console.log('Webhook response text:', responseText);

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
