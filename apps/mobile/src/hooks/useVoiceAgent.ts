import { useState, useCallback } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { useConversation } from '@elevenlabs/react-native';

export interface VoiceAgentStatus {
  status: 'idle' | 'connecting' | 'connected' | 'thinking' | 'error';
  error?: string;
}

export interface UseVoiceAgentReturn {
  status: VoiceAgentStatus['status'];
  error?: string;
  conversationId: string | null;
  isSpeaking: boolean;
  startConversation: (agentId: string) => Promise<void>;
  stopConversation: () => Promise<void>;
  pauseConversation: () => void;
  resumeConversation: () => void;
  isPaused: boolean;
  requestMicrophonePermission: () => Promise<boolean>;
}

export const useVoiceAgent = (): UseVoiceAgentReturn => {
  const [error, setError] = useState<string | undefined>();
  const [isPaused, setIsPaused] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Use the official ElevenLabs React Native SDK
  const conversation = useConversation({
    onConnect: ({ conversationId: convId }) => {
      console.log('✅ Voice conversation CONNECTED:', convId);
      console.trace('✅ Stack trace for connection');
      setConversationId(convId);
      setError(undefined);
    },
    onDisconnect: () => {
      console.log('❌ Voice conversation DISCONNECTED');
      console.trace('❌ Stack trace for disconnection');
      setConversationId(null);
      setIsPaused(false);
    },
    onError: (message) => {
      console.error('⚠️ Voice conversation ERROR:', message);
      console.trace('⚠️ Stack trace for error');
      setError(message);
    },
    onMessage: (message) => {
      console.log('💬 Voice message received:', message);
    },
  });

  // Request microphone permission for Android
  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone for voice conversations.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Error requesting microphone permission:', err);
        return false;
      }
    }
    return true;
  }, []);

  const startConversation = useCallback(async (agentId: string) => {
    try {
      setError(undefined);

      console.log('🚀 START CONVERSATION - agentId:', agentId, 'current status:', conversation.status);

      // Check if already connected to avoid multiple sessions
      if (conversation.status === 'connected') {
        console.log('🚀 Already connected, skipping new session');
        return;
      }

      console.log('🚀 Calling conversation.startSession...');
      // Start session with the official SDK (permission will be requested automatically by SDK)
      await conversation.startSession({
        agentId,
      });
      console.log('🚀 conversation.startSession completed');

    } catch (err: any) {
      console.error('🚀 FAILED to start conversation:', err);
      console.trace('🚀 Stack trace for start failure');
      setError(err.message || 'Failed to start conversation');
    }
  }, [conversation.status, conversation.startSession]);

  const stopConversation = useCallback(async () => {
    try {
      console.log('🛑 STOP CONVERSATION - current status:', conversation.status);
      console.trace('🛑 Stack trace for stop call');

      // Only stop if actually connected or connecting
      if (conversation.status === 'connected' || conversation.status === 'connecting') {
        console.log('🛑 Calling conversation.endSession...');
        await conversation.endSession();
        console.log('🛑 Voice conversation ended successfully');
      } else {
        console.log('🛑 No active conversation to stop (status:', conversation.status, ')');
      }

      setIsPaused(false);
    } catch (err: any) {
      console.error('🛑 FAILED to stop conversation:', err);
      console.trace('🛑 Stack trace for stop failure');
      setError(err.message || 'Failed to stop conversation');
    }
  }, [conversation.status, conversation.endSession]);

  const pauseConversation = useCallback(() => {
    console.log('Pausing conversation - muting microphone');
    setIsPaused(true);
    conversation.setMicMuted(true);
  }, [conversation.setMicMuted]);

  const resumeConversation = useCallback(() => {
    console.log('Resuming conversation - unmuting microphone');
    setIsPaused(false);
    conversation.setMicMuted(false);
  }, [conversation.setMicMuted]);

  // Map SDK status to our status type
  const getStatus = (): VoiceAgentStatus['status'] => {
    if (error) return 'error';
    switch (conversation.status) {
      case 'connecting':
        return 'connecting';
      case 'connected':
        return conversation.isSpeaking ? 'thinking' : 'connected';
      case 'disconnected':
      default:
        return 'idle';
    }
  };

  return {
    status: getStatus(),
    error,
    conversationId,
    isSpeaking: conversation.isSpeaking,
    startConversation,
    stopConversation,
    pauseConversation,
    resumeConversation,
    isPaused,
    requestMicrophonePermission,
  };
};
