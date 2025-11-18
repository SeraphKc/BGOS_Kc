import { useCallback, useRef } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { useConversation, ConversationStatus } from '@elevenlabs/react-native';
import { useDispatch, useSelector } from 'react-redux';
import { VoiceActions, RootState } from '@bgos/shared-state';
import { fetchConversationToken } from '../services/elevenLabsService';

export const useVoiceAgent = () => {
  const dispatch = useDispatch();
  const manualStopRef = useRef(false);
  const { status: sdkStatus, isSpeaking } = useConversation({
    onConnect: ({ conversationId: convId }) => {
      console.log('Voice conversation connected:', convId);
      dispatch(VoiceActions.setConversationMetadata({ conversationId: convId }));
      dispatch(VoiceActions.startRecording());
    },
    onDisconnect: () => {
      console.log('Voice conversation disconnected');
      if (manualStopRef.current) {
        manualStopRef.current = false;
      } else {
        dispatch(VoiceActions.stopVoiceSession());
      }
    },
    onError: (message) => {
      console.error('Voice conversation error:', message);
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

  const { status, error, isPaused, conversationId } = useSelector(
    (state: RootState) => state.voice
  );

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
        dispatch(VoiceActions.setVoiceError(message));
        return;
      }

      if (sdkStatus === 'connecting' || sdkStatus === 'connected') {
        console.log('Conversation already running, skipping start');
        return;
      }

      try {
        dispatch(VoiceActions.clearVoiceError());
        dispatch(VoiceActions.startVoiceSession({ conversationId: null }));

        const conversationToken = await fetchConversationToken(agentId);
        await useConversation.startSession({ conversationToken });
      } catch (err: any) {
        console.error('Failed to start conversation:', err);
        const message = err?.message || 'Failed to start conversation';
        dispatch(VoiceActions.setVoiceError(message));
        dispatch(VoiceActions.stopVoiceSession());
      }
    },
    [sdkStatus, dispatch]
  );

  const stopConversation = useCallback(async () => {
    try {
      console.log('Stopping voice conversation, current status:', sdkStatus);

      if (sdkStatus === 'connected' || sdkStatus === 'connecting') {
        manualStopRef.current = true;
        await useConversation.endSession();
      } else {
        manualStopRef.current = false;
      }
      dispatch(VoiceActions.stopVoiceSession());
    } catch (err: any) {
      console.error('Failed to stop conversation:', err);
      const message = err?.message || 'Failed to stop conversation';
      dispatch(VoiceActions.setVoiceError(message));
      manualStopRef.current = false;
    }
  }, [sdkStatus, dispatch]);

  const pauseConversation = useCallback(() => {
    console.log('Muting microphone');
    useConversation.setMicMuted(true);
    dispatch(VoiceActions.pauseRecording());
  }, [dispatch]);

  const resumeConversation = useCallback(() => {
    console.log('Unmuting microphone');
    useConversation.setMicMuted(false);
    dispatch(VoiceActions.resumeRecording());
  }, [dispatch]);

  return {
    status,
    error,
    conversationId,
    isSpeaking,
    startConversation,
    stopConversation,
    pauseConversation,
    resumeConversation,
    isPaused,
    requestMicrophonePermission,
  };
};
