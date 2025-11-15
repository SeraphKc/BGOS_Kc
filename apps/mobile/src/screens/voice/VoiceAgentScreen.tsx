import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootState } from '@bgos/shared-state';
import { COLORS } from '@bgos/shared-logic';
import { useVoiceAgent } from '../../hooks/useVoiceAgent';
import { VoiceVisualizer } from '../../components/voice/VoiceVisualizer';
import { useVoiceAgentModal } from '../../contexts/VoiceAgentContext';
import { MicrophoneIcon } from '../../components/icons/MicrophoneIcon';
import { MicrophoneMutedIcon } from '../../components/icons/MicrophoneMutedIcon';
import { EndCallIcon } from '../../components/icons/EndCallIcon';

export const VoiceAgentScreen: React.FC = () => {
  const navigation = useNavigation();
  const { onTranscriptReady } = useVoiceAgentModal();
  const [permissionError, setPermissionError] = useState<string | undefined>();
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  console.log('🔵 VoiceAgentScreen RENDER');

  const selectedAssistant = useSelector((state: RootState) =>
    state.assistants.list.find((a) => a.id === state.assistants.selectedAssistantId)
  );

  const assistantTokenRef = useRef<string | undefined>(selectedAssistant?.s2sToken);
  const assistantNameRef = useRef<string | undefined>(selectedAssistant?.name);

  const {
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
  } = useVoiceAgent();

  console.log('🔵 VoiceAgentScreen - status:', status, 'isSpeaking:', isSpeaking, 'conversationId:', conversationId);

  // Track conversation ID for transcript
  const conversationIdRef = useRef<string | null>(null);
  const hasStartedRef = useRef(false);

  // Store stable references to conversation functions
  const startConversationRef = useRef(startConversation);
  const stopConversationRef = useRef(stopConversation);
  const requestPermissionRef = useRef(requestMicrophonePermission);

  // Update conversation ID ref
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  // Update function refs when they change
  useEffect(() => {
    startConversationRef.current = startConversation;
    stopConversationRef.current = stopConversation;
    requestPermissionRef.current = requestMicrophonePermission;
  }, [startConversation, stopConversation, requestMicrophonePermission]);

  useEffect(() => {
    assistantTokenRef.current = selectedAssistant?.s2sToken;
    assistantNameRef.current = selectedAssistant?.name;
  }, [selectedAssistant?.s2sToken, selectedAssistant?.name]);

  const assistantToken = selectedAssistant?.s2sToken;
  const assistantName = selectedAssistant?.name;


  // CRITICAL: Use useFocusEffect for navigation-aware lifecycle
  useFocusEffect(
    useCallback(() => {
      console.log('dYY? VoiceAgentScreen FOCUSED - screen is visible');

      let cancelled = false;

      // Function to start conversation with permission check
      const startWithPermission = async () => {
        const token = assistantTokenRef.current;
        const name = assistantNameRef.current;

        if (!token) {
          console.error('dY"' No s2sToken found for assistant');
          setPermissionError('Assistant configuration missing');
          return;
        }

        try {
          console.log('dYY? Requesting microphone permission...');
          setIsRequestingPermission(true);

          const hasPermission = await requestPermissionRef.current();

          setIsRequestingPermission(false);
          console.log('dYY? Microphone permission result:', hasPermission);

          if (!hasPermission) {
            console.error('dY"' Microphone permission denied');
            setPermissionError('Microphone permission is required for voice conversations');
            return;
          }

          console.log('dYY? Starting voice conversation with agent:', name);
          console.log('dYY? Agent s2sToken:', token.substring(0, 20) + '...');

          if (cancelled) {
            console.log('dYY? Start request cancelled, skipping startConversation call');
            return;
          }

          await startConversationRef.current(token);
          hasStartedRef.current = true;

          console.log('?o. Voice conversation started successfully');
          setPermissionError(undefined);
        } catch (err) {
          console.error('dY"' Failed to start conversation:', err');
          setPermissionError('Failed to start voice conversation');
        }
      };

      // Start conversation when screen becomes visible
      startWithPermission();

      // Cleanup: Stop conversation when screen loses focus (navigating away or unmounting)
      return () => {
        cancelled = true;
        console.log('dYY? VoiceAgentScreen BLURRED - screen lost focus, stopping conversation');
        if (!hasStartedRef.current) {
          return;
        }

        stopConversationRef.current()
          .catch((err) => {
            console.error('dY"' Error stopping conversation:', err');
          })
          .finally(() => {
            hasStartedRef.current = false;
          });
      };
    }, [])
  );

  // Handle stop and fetch transcript
  const handleStop = useCallback(async () => {
    console.log('🟡 User clicked stop button');

    await stopConversation();
    hasStartedRef.current = false;

    if (conversationIdRef.current && onTranscriptReady) {
      console.log('🟡 Calling onTranscriptReady with conversationId:', conversationIdRef.current);
      onTranscriptReady(conversationIdRef.current);
    }

    console.log('🟡 Navigating back');
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [stopConversation, onTranscriptReady, navigation]);

  // Handle pause/resume
  const handlePauseResume = () => {
    if (isPaused) {
      resumeConversation();
    } else {
      pauseConversation();
    }
  };

  const getVisualizerMode = () => {
    if (isSpeaking) return 'thinking';
    if (status === 'connected') return 'listening';
    return 'idle';
  };

  const getStatusText = () => {
    if (permissionError) return permissionError;
    if (isRequestingPermission) return 'Requesting microphone permission...';
    if (error) return error;
    if (status === 'connecting') return 'Connecting...';
    if (status === 'connected') {
      if (isPaused) return 'Microphone muted';
      if (isSpeaking) return 'AI is speaking...';
      return 'Listening...';
    }
    return 'Initializing...';
  };

  const hasError = !!(error || permissionError);

  // Add retry functionality for errors
  const handleRetry = useCallback(async () => {
    console.log('🔄 User clicked retry');
    setPermissionError(undefined);

    if (!selectedAssistant?.s2sToken) {
      console.error('🔴 No s2sToken found for assistant');
      setPermissionError('Assistant configuration missing');
      return;
    }

    try {
      console.log('🟡 Requesting microphone permission...');
      setIsRequestingPermission(true);

      const hasPermission = await requestMicrophonePermission();

      setIsRequestingPermission(false);
      console.log('🟡 Microphone permission result:', hasPermission);

      if (!hasPermission) {
        console.error('🔴 Microphone permission denied');
        setPermissionError('Microphone permission is required for voice conversations');
        return;
      }

      console.log('🟢 Retrying voice conversation with agent:', selectedAssistant.name);

      await startConversation(selectedAssistant.s2sToken);

      console.log('✅ Voice conversation started successfully on retry');
      setPermissionError(undefined);
    } catch (err) {
      console.error('🔴 Failed to start conversation on retry:', err);
      setPermissionError('Failed to start voice conversation');
    }
  }, [selectedAssistant, startConversation, requestMicrophonePermission]);

  return (
    <>
      <StatusBar backgroundColor="#212121" barStyle="light-content" />
      <View style={styles.container}>
        {/* Header with assistant name */}
        <View style={styles.header}>
          <Text style={styles.headerText}>
            {selectedAssistant?.name || 'Voice Assistant'}
          </Text>
          {status === 'connecting' && (
            <ActivityIndicator size="small" color="#FFD700" style={styles.loader} />
          )}
        </View>

        {/* Voice Visualizer */}
        <View style={styles.visualizerContainer}>
          <VoiceVisualizer
            isActive={status === 'connected'}
            mode={getVisualizerMode()}
          />

          <Text style={[
            styles.statusText,
            hasError && styles.errorText
          ]}>
            {getStatusText()}
          </Text>

          {status === 'connected' && !hasError && (
            <Text style={styles.hintText}>
              Voice conversation in progress
            </Text>
          )}

          {/* Show retry button on error */}
          {hasError && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
              activeOpacity={0.7}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Control Buttons */}
        <View style={styles.controlsContainer}>
          <View style={styles.bottomButtons}>
            {/* Mute/Unmute Button */}
            {status === 'connected' && (
              <TouchableOpacity
                style={[styles.controlButton, isPaused && styles.mutedButton]}
                onPress={handlePauseResume}
                activeOpacity={0.7}
              >
                <View style={styles.controlButtonIconContainer}>
                  {isPaused ? (
                    <MicrophoneMutedIcon size={24} color="rgba(255, 255, 255, 0.5)" />
                  ) : (
                    <MicrophoneIcon size={24} color="#FFD700" />
                  )}
                </View>
                <Text style={styles.controlButtonLabel}>
                  {isPaused ? 'Unmute' : 'Mute'}
                </Text>
              </TouchableOpacity>
            )}

            {/* End Call Button */}
            <TouchableOpacity
              style={[styles.controlButton, styles.endCallButton]}
              onPress={handleStop}
              activeOpacity={0.7}
            >
              <View style={styles.controlButtonIconContainer}>
                <EndCallIcon size={24} color="#d66171" />
              </View>
              <Text style={styles.controlButtonLabel}>End Call</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#212121',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.WHITE_1,
    fontFamily: 'Styrene-B',
  },
  loader: {
    marginLeft: 12,
  },
  visualizerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'Styrene-B',
  },
  statusText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 40,
    fontFamily: 'Styrene-B',
    fontWeight: '500',
  },
  hintText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    fontFamily: 'Styrene-B',
  },
  controlsContainer: {
    padding: 40,
    paddingBottom: 60,
    alignItems: 'center',
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  mutedButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  endCallButton: {
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    borderColor: 'rgba(255, 68, 68, 0.4)',
  },
  controlButtonIconContainer: {
    marginBottom: 4,
  },
  controlButtonLabel: {
    color: COLORS.WHITE_1,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Styrene-B',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#FFD700',
    borderRadius: 24,
  },
  retryButtonText: {
    color: '#212121',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Styrene-B',
    textAlign: 'center',
  },
});
