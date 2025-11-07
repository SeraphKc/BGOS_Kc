import {ChatHistory} from "../model/ChatHistory";

export interface SendMessageParams {
    message: ChatHistory;
    assistantUrl: string;
    audio?: Blob;
    file?: File;
    signal?: AbortSignal;
}