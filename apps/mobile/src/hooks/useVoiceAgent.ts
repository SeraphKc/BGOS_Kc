import { useState, useCallback, useRef } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { useConversation } from '@elevenlabs/react-native';
import { useDispatch } from 'react-redux';
import { VoiceActions } from '@bgos/shared-state';
import { fetchConversationToken } from '../services/elevenLabsService';

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
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const dispatch = useDispatch();
  const manualStopRef = useRef(false);

  const conversation = useConversation({
    onConnect: ({ conversationId: convId }) => {
      console.log('Voice conversation connected:', convId);
      setConversationId(convId);
      setError(undefined);
      dispatch(VoiceActions.setConversationMetadata({ conversationId: convId }));
      dispatch(VoiceActions.startRecording());
    },
    onDisconnect: () => {
      console.log('Voice conversation disconnected');
      setConversationId(null);
      setIsPaused(false);
      dispatch(VoiceActions.setAgentSpeaking(false));

      if (manualStopRef.current) {
        manualStopRef.current = false;
      } else {
        dispatch(VoiceActions.stopVoiceSession());
      }
    },
    onError: (message) => {
      console.error('Voice conversation error:', message);
      setError(message);
      dispatch(VoiceActions.setVoiceError(message));
      manualStopRef.current = false;
    },
    onMessage: (message) => {
      console.log('Voice message received:', message);
    },
    onModeChange: ({ mode }) => {
      dispatch(VoiceActions.setAgentSpeaking(mode === 'speaking'));
    },
  });

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

  const startConversation = useCallback(
    async (agentId: string) => {
      if (!agentId) {
        const message = 'Assistant configuration missing';
        setError(message);
        dispatch(VoiceActions.setVoiceError(message));
        return;
      }

      if (conversation.status === 'connecting' || conversation.status === 'connected') {
        console.log('Conversation already running, skipping start');
        return;
      }

      try {
        setError(undefined);
        setIsBootstrapping(true);
        dispatch(VoiceActions.clearVoiceError());
        dispatch(VoiceActions.startVoiceSession({ conversationId: null }));

        const conversationToken = await fetchConversationToken(agentId);
        await conversation.startSession({ conversationToken });
      } catch (err: any) {
        console.error('Failed to start conversation:', err);
        const message = err?.message || 'Failed to start conversation';
        setError(message);
        dispatch(VoiceActions.setVoiceError(message));
        dispatch(VoiceActions.stopVoiceSession());
        throw err;
      } finally {
        setIsBootstrapping(false);
      }
    },
    [conversation, dispatch]
  );

  const stopConversation = useCallback(async () => {
    try {
      console.log('Stopping voice conversation, current status:', conversation.status);

      if (conversation.status === 'connected' || conversation.status === 'connecting') {
        manualStopRef.current = true;
        await conversation.endSession();
      } else {
        manualStopRef.current = false;
      }

      setIsPaused(false);
    } catch (err: any) {
      console.error('Failed to stop conversation:', err);
      const message = err?.message || 'Failed to stop conversation';
      setError(message);
      dispatch(VoiceActions.setVoiceError(message));
      manualStopRef.current = false;
      throw err;
    }
  }, [conversation, dispatch]);

  const pauseConversation = useCallback(() => {
    console.log('Muting microphone');
    setIsPaused(true);
    conversation.setMicMuted(true);
    dispatch(VoiceActions.pauseRecording());
  }, [conversation, dispatch]);

  const resumeConversation = useCallback(() => {
    console.log('Unmuting microphone');
    setIsPaused(false);
    conversation.setMicMuted(false);
    dispatch(VoiceActions.resumeRecording());
  }, [conversation, dispatch]);

  const getStatus = (): VoiceAgentStatus['status'] => {
    if (error) return 'error';
    if (isBootstrapping) return 'connecting';

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
