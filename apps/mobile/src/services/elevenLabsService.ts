const ELEVENLABS_API_KEY = 'sk_3c3c83bdce7a69742837261149687cf4c7611c10a09f5804';
const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

export interface TranscriptMessage {
  role: 'user' | 'assistant';
  message: string;
  timestamp: string;
}

export interface ConversationTranscript {
  conversation_id: string;
  status: 'processing' | 'done';
  transcript: TranscriptMessage[];
}

export const fetchConversationTranscript = async (
  conversationId: string,
  maxRetries: number = 10
): Promise<TranscriptMessage[]> => {
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      const response = await fetch(
        `${ELEVENLABS_API_BASE}/convai/conversations/${conversationId}`,
        {
          method: 'GET',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch transcript: ${response.statusText}`);
      }

      const data: ConversationTranscript = await response.json();

      if (data.status === 'done' && data.transcript && data.transcript.length > 0) {
        // Filter out empty messages
        const filteredTranscript = data.transcript.filter(
          (msg) => msg.message && msg.message.trim().length > 0
        );
        return filteredTranscript;
      }

      // Wait 3 seconds before next attempt
      await new Promise((resolve) => setTimeout(resolve, 3000));
      attempts++;
    } catch (error) {
      console.error(`Transcript fetch attempt ${attempts + 1} failed:`, error);
      attempts++;

      if (attempts < maxRetries) {
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } else {
        throw error;
      }
    }
  }

  throw new Error('Transcript not ready after maximum retries');
};

/**
 * Convert audio file to speech-to-text
 * @param audioBase64 Base64 encoded audio data
 * @returns Transcribed text
 */
export const speechToText = async (audioBase64: string): Promise<string> => {
  try {
    const response = await fetch(`${ELEVENLABS_API_BASE}/speech-to-text`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio: audioBase64,
        model_id: 'eleven_multilingual_v2',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Speech-to-text failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.text || '';
  } catch (error) {
    console.error('ElevenLabs speechToText error:', error);
    throw error;
  }
};

/**
 * Convert text to speech audio
 * @param text Text to convert to speech
 * @param voiceId ElevenLabs voice ID (from assistant.s2sToken)
 * @returns Base64 encoded audio data
 */
export const textToSpeech = async (text: string, voiceId: string): Promise<string> => {
  try {
    const response = await fetch(`${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Text-to-speech failed: ${response.status} ${errorText}`);
    }

    // Convert response blob to base64
    const blob = await response.blob();
    const base64 = await blobToBase64(blob);
    return base64;
  } catch (error) {
    console.error('ElevenLabs textToSpeech error:', error);
    throw error;
  }
};

/**
 * Convert Blob to base64 string
 * @param blob Blob to convert
 * @returns Base64 string
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix (e.g., "data:audio/mpeg;base64,")
      const base64Data = base64.split(',')[1] || base64;
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
