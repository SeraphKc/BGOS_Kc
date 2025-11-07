import {getWebhookUrl} from "../config/webhoock";
import {SendMessageParams} from "../types/n8n/SendMessageParams";
import {WebhookResponse} from "../types/n8n/WebhookResponse";
import {useCallback, useState} from "react";
import {ChatHistory, Sender, FileInfo} from "../types/model/ChatHistory";


declare global {
  interface Window {
    electronAPI: {
      sendWebhookRequest: (url: string, formDataObj: any) => Promise<WebhookResponse>;
      showUnreadNotification: (notificationData: {
        chatId: string;
        chatTitle: string;
        unreadCount: number;
        assistantName: string;
      }) => Promise<{ success: boolean; error?: string }>;
      isWindowVisible: () => Promise<boolean>;
      focusWindow: () => Promise<boolean>;
      onOpenChatNotification: (callback: (data: { chatId: string }) => void) => void;
      removeOpenChatNotificationListener: () => void;
    };
  }
}

export function mapChatHistoryFromServer(data: any): ChatHistory {
    return {
        id: data.id,
        chatId: data.chat_id,
        sender: data.sender as Sender,
        sentDate: typeof data.sent_date === "string" ? data.sent_date : new Date().toISOString(),
        text: data.text,
        hasAttachment: data.has_attachment,
        duration: data.duration ?? undefined,
        artifact_code: data.artifact_code ?? undefined,
        isCode: data.is_code ?? false,
        isArticle: data.is_article ?? false,
        article_text: data.article_text ?? undefined,
        is_multi_response: data.is_multi_response ?? false,
        files: data.files ? data.files.map((file: any) => ({
            fileName: file.file_name || file.fileName,
            fileData: file.file_data || file.fileData,
            fileMimeType: file.file_mime_type || file.fileMimeType,
            isVideo: file.is_video || file.isVideo || false,
            isImage: file.is_image || file.isImage || false,
            isDocument: file.is_document || file.isDocument || false,
            isAudio: file.is_audio || file.isAudio || false
        })) : undefined,
        isAudio: data.is_audio ?? false,
        isMixedAttachments: data.is_mixed_attachments ?? false,
        audioData: data.audio_data ?? undefined,
        audioFileName: data.audio_file_name ?? undefined,
        audioMimeType: data.audio_mime_type ?? undefined,
    };
}

export const useWebhook = (assistantWebhook: string, userId: string) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendMessage = useCallback(async (params: SendMessageParams): Promise<ChatHistory> => {
        setIsLoading(true);
        setError(null);

        try {
            const webhookUrl = `${assistantWebhook ? assistantWebhook : params.assistantUrl}/${userId}`;

            const formData = new FormData();
            let chatMessage: ChatHistory = params.message;

            // основные данные для сохранения ChatHistory
            formData.append('chatId', chatMessage.chatId);
            formData.append('sender', chatMessage.sender);
            formData.append('sentDate', chatMessage.sentDate);
            formData.append('text', chatMessage.text);
            formData.append('isAudio', String(chatMessage.isAudio));
            formData.append('hasAttachment', String(chatMessage.hasAttachment));
            formData.append('duration', String(chatMessage.duration || 0));
            formData.append('isMixedAttachments', String(chatMessage.isMixedAttachments || false));
            if (chatMessage.audioFileName) {
                formData.append('audioFileName', chatMessage.audioFileName);
                formData.append('audioData', chatMessage.audioData);
                formData.append('audioMimeType', chatMessage.audioMimeType);
                
                // Добавляем как binary файл для n8n для запуска transcribe
                if (chatMessage.audioData) {
                    const audioBytes = Uint8Array.from(atob(chatMessage.audioData), c => c.charCodeAt(0));
                    const audioBlob = new Blob([audioBytes], { type: chatMessage.audioMimeType || 'audio/webm' });
                    formData.append('audioFile', audioBlob, chatMessage.audioFileName);
                }
            }
            if (chatMessage.files && chatMessage.files.length > 0) {
                formData.append('files', JSON.stringify(chatMessage.files));
            }

            if (params.file) {
                if (params.file.type.startsWith('image/')) {
                    formData.append('isImage', true.toString());
                } else if (params.file.type.startsWith('video/')) {
                    formData.append('isVideo', true.toString());
                } else if (params.file.type.startsWith('audio/')) {
                    formData.append('isAudio', true.toString());
                } else {
                    formData.append('hasAttachment', true.toString());
                }
            }

            const formDataObj = {};
            for (const [key, value] of formData.entries()) {
                if (value instanceof Blob) {
                    // todo пока работаем с base64, пока полноценно не разобрался как корректно сохранять
                    //  и извлекать blob в БД в связке postgresql + n8n. БД нормально работает с bytea,
                    //  но появляется много лишних шагов конвертации на n8n
                    const base64 = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(value);
                    });
                    formDataObj[key] = {
                        type: 'blob',
                        data: base64,
                        name: value.name,
                        mimeType: value.type
                    };
                } else {
                    formDataObj[key] = value;
                }
            }

            console.log('Using Electron IPC for webhook request. FormData structure: ', formDataObj);

            const response = await window.electronAPI.sendWebhookRequest(webhookUrl, formDataObj);

            console.log('Webhook response received: ', response);

            if (!response || response.error || !response.data) {
                console.log('Empty response from n8n, returning empty text response');
                return {
                    id: '-1', // todo добавить обработку ошибочных id
                    chatId: chatMessage.chatId,
                    sender: 'assistant',
                    sentDate: new Date().toISOString(),
                    text: response?.error ? response.error : 'Server Error',
                    hasAttachment: false,
                    isAudio: false,
                    isMixedAttachments: false,
                };
            }

            return mapChatHistoryFromServer(JSON.parse(response.data));

            // if (window.electronAPI && window.electronAPI.sendWebhookRequest) {
            //
            // } else {
            //
            // }
            // // todo надо согласовать, нужно ли оставлять альтернативный вариант
            // console.log('IPC not available, using direct fetch');
            // console.log('window.electronAPI:', window.electronAPI);
            //
            // const response = await fetch(webhookUrl, {
            //     method: 'POST',
            //     body: formData,
            //     signal: params.signal,
            //     mode: 'cors',
            // });
            //
            // console.log('Response status:', response.status, response.statusText);
            //
            // if (!response.ok) {
            //     throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            // }
            //
            // // Check if response is binary audio data
            // const contentType = response.headers.get('content-type');
            // const isAudioResponse = contentType && (
            //     contentType.includes('audio/') ||
            //     contentType.includes('application/octet-stream') ||
            //     contentType.includes('binary')
            // );
            //
            // if (isAudioResponse) {
            //     console.log('Direct fetch: Detected binary audio response');
            //     const arrayBuffer = await response.arrayBuffer();
            //
            //     return {
            //         type: 'audio',
            //         data: arrayBuffer,
            //         contentType: contentType,
            //         audioFileName: `audio_response_${Date.now()}.mp3`
            //     };
            // } else {
            //     // Handle text response
            //     const reader = response.body?.getReader();
            //     if (!reader) {
            //         throw new Error('Failed to get response reader');
            //     }
            //
            //     let response = '';
            //     while (true) {
            //         const {done, value} = await reader.read();
            //         if (done) break;
            //         response += new TextDecoder().decode(value);
            //     }
            //
            //     return {
            //         type: 'text',
            //         data: response
            //     };
            // }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                const timeoutError = 'Request timed out after 120 seconds';
                setError(timeoutError);
                throw new Error(timeoutError);
            }

            let errorMessage = '';
            if (error instanceof Error) {
                if (error.message.includes('Failed to fetch')) {
                    errorMessage = 'Network error: Unable to connect to webhook server. Check URL and internet connection.';
                } else if (error.message.includes('CORS')) {
                    errorMessage = 'CORS error: Server does not allow requests from this origin.';
                } else if (error.message.includes('HTTP error')) {
                    errorMessage = `Server error: ${error.message}`;
                } else {
                    errorMessage = `Error sending message to webhook: ${error.message}`;
                }
            } else {
                errorMessage = 'Unknown error occurred';
            }

            setError(errorMessage);
            console.error('Webhook error details:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [assistantWebhook]);

    const setWebhookLoading = () => setIsLoading(true);

    return {
        sendMessage,
        isLoading,
        setWebhookLoading,
        error,
    };
};