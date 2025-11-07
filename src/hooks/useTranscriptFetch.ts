import { useState } from 'react';

interface TranscriptMessage {
    role: string;
    message: string;
    time_in_call_secs: number;
}

interface ConversationResponse {
    agent_id: string;
    conversation_id: string;
    status: 'processing' | 'done';
    transcript: TranscriptMessage[];
}

export const useTranscriptFetch = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const MAX_RETRIES = 10; // Increase max retries
    const RETRY_DELAY = 3000; // 3 seconds between retries

    const fetchTranscript = async (conversationId: string): Promise<TranscriptMessage[] | null> => {
        try {
            setIsLoading(true);
            setError(null);

            let retries = 0;
            let data: ConversationResponse | null = null;
            
            while (retries < MAX_RETRIES) {
                const response = await fetch(
                    `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
                    {
                        headers: {
                            'xi-api-key': 'sk_3c3c83bdce7a69742837261149687cf4c7611c10a09f5804'
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch transcript');
                }

                data = await response.json();

                if (data.status === 'done' && data.transcript) {
                    return data.transcript;
                }

                console.log(`Transcript still processing, retry ${retries + 1}/${MAX_RETRIES}`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));

                retries++;
            }

            if (data && data.status === 'done' && data.transcript) {
                return data.transcript;
            }

            return null;
        } catch (err) {
            console.error('Error fetching transcript:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch transcript');
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        fetchTranscript,
        isLoading,
        error
    };
};