import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  PermissionsAndroid,
  Platform,
  Alert,
  Linking,
  BackHandler,
  AppState,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '@bgos/shared-state';
import { COLORS } from '@bgos/shared-logic';
import { useVoiceSession } from '../../hooks/useVoiceSession';
import { VoiceVisualizer } from '../../components/voice/VoiceVisualizer';
import { TranscriptionOverlay } from '../../components/voice/TranscriptionOverlay';
import { useVoiceAgentModal } from '../../contexts/VoiceAgentContext';
import { EndCallIcon } from '../../components/icons/EndCallIcon';

export const VoiceAgentScreen: React.FC = () => {
  const navigation = useNavigation();
  const { onTranscriptReady } = useVoiceAgentModal();
  const [permissionError, setPermissionError] = useState<string | undefined>();
  const isMounted = useRef(true);

  console.log('🔵 VoiceAgentScreen RENDER');

  const selectedAssistant = useSelector((state: RootState) =>
    state.assistants.list.find((a) => a.id === state.assistants.selectedAssistantId)
  );

  // Memoize agentId to prevent unnecessary re-initialization of voice session
  const agentId = useMemo(() => selectedAssistant?.s2sToken, [selectedAssistant?.s2sToken]);

  // Track component lifecycle
  useEffect(() => {
    isMounted.current = true;
    console.log('✅ VoiceAgentScreen MOUNTED');
    return () => {
      console.log('🔴 VoiceAgentScreen UNMOUNTED');
      isMounted.current = false;
    };
  }, []);

  // Track screen focus/blur for diagnostics
  useEffect(() => {
    const blurListener = navigation.addListener('blur', () => {
      console.log('⚠️ VoiceAgentScreen BLURRED - screen lost focus');
    });

    const focusListener = navigation.addListener('focus', () => {
      console.log('✅ VoiceAgentScreen FOCUSED - screen gained focus');
    });

    return () => {
      blurListener();
      focusListener();
    };
  }, [navigation]);

  const { sessionState, transcript, startSession, endSession } = useVoiceSession({
    agentId
  });
  const scrollViewRef = useRef<ScrollView>(null);
  const conversationIdRef = useRef<string | null>(null);

  // Ref to track current session status - solves stale closure bug in navigation listeners
  const sessionStatusRef = useRef(sessionState.status);

  // Keep the ref in sync with the current status
  useEffect(() => {
    sessionStatusRef.current = sessionState.status;
  }, [sessionState.status]);

  // Auto-scroll transcript to bottom when new messages arrive
  useEffect(() => {
    if (transcript.length > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [transcript]);

  // Update conversation ID ref
  useEffect(() => {
    conversationIdRef.current = sessionState.conversationId;
  }, [sessionState.conversationId]);

  // Handle cleanup and prevent accidental dismissal during active session
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      const currentStatus = sessionStatusRef.current;
      
      // Only prevent navigation if session is active
      if (currentStatus === 'connected' || currentStatus === 'connecting') {
        e.preventDefault();
        console.log('⚠️ Attempted to dismiss voice screen during active session');

        Alert.alert(
          'End Voice Session?',
          'Your voice session is still active. Do you want to end it and go back?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {},
            },
            {
              text: 'End Session',
              style: 'destructive',
              onPress: () => {
                endSession()
                  .then(() => {
                    navigation.dispatch(e.data.action);
                  })
                  .catch((err) => {
                    console.warn('⚠️ Error cleaning up session on navigation:', err);
                    navigation.dispatch(e.data.action);
                  });
              },
            },
          ]
        );
      }
    });

    return unsubscribe;
  }, [navigation, endSession]); 

  // Handle manual session start
  const handleStart = useCallback(async () => {
    if (!agentId) {
      console.error('❌ No s2sToken found for assistant');
      setPermissionError('Assistant configuration missing');
      return;
    }

    setPermissionError(undefined);

    // Explicit permission check for Android
    if (Platform.OS === 'android') {
      try {
        const checkResult = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        
        if (!checkResult) {
          console.log('🎤 Requesting microphone permission...');
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
              title: 'Microphone Permission',
              message: 'This app needs access to your microphone to talk to the AI agent.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );

          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log('❌ Microphone permission denied');
            setPermissionError('Microphone permission needed');
            return;
          }
          console.log('✅ Microphone permission granted');
          
          // Extra safety delay if we just got permissions to let audio system initialize
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      } catch (err) {
        console.warn('Permission check error:', err);
        return;
      }
    }

    if (!isMounted.current) {
      console.log('⚠️ Component unmounted during permission check, aborting start');
      return;
    }

    try {
      console.log('🚀 Starting voice session...');

      const delayedStart = async () => {
        // Standard small delay to ensure UI is ready
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (!isMounted.current) return;
        
        try {
          await startSession();
          console.log('✅ Voice session start command sent');
        } catch (err) {
          if (isMounted.current) {
            console.error('❌ Failed to start session:', err);
            setPermissionError('Failed to start voice session');
          }
        }
      };
      
      await delayedStart();

    } catch (err) {
      if (isMounted.current) {
        console.error('❌ Failed during session initialization:', err);
        setPermissionError('Failed to initialize voice session');
      }
    }
  }, [agentId, selectedAssistant, startSession]);

  // Handle stop and fetch transcript
  const handleStop = useCallback(async () => {
    console.log('🟡 User clicked stop button');

    await endSession();

    if (conversationIdRef.current && onTranscriptReady) {
      onTranscriptReady({
        conversationId: conversationIdRef.current,
      });
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [endSession, onTranscriptReady, navigation]);

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      const currentStatus = sessionStatusRef.current;

      if (currentStatus === 'connected' || currentStatus === 'connecting') {
        Alert.alert(
          'End Voice Session?',
          'Do you want to end the voice session?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {},
            },
            {
              text: 'End Session',
              style: 'destructive',
              onPress: () => {
                handleStop();
              },
            },
          ]
        );
        return true; 
      }
      return false;
    });

    return () => backHandler.remove();
  }, [handleStop]);

  const getStatusText = () => {
    if (permissionError) return permissionError;
    if (sessionState.error) return sessionState.error;
    if (sessionState.status === 'idle') return 'Ready to start';
    if (sessionState.status === 'connecting') return 'Connecting...';
    if (sessionState.status === 'connected') {
      if (sessionState.isThinking) return 'AI is thinking...';
      if (sessionState.isSpeaking) return 'AI is speaking...';
      if (sessionState.isListening) return 'Listening...';
      return 'Connected';
    }
    if (sessionState.status === 'disconnected') return 'Session ended';
    return 'Initializing...';
  };

  const hasError = !!(sessionState.error || permissionError);
  const isIdle = sessionState.status === 'idle';
  const isConnecting = sessionState.status === 'connecting';
  const isConnected = sessionState.status === 'connected';

  return (
    <>
      <StatusBar backgroundColor="#212121" barStyle="light-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>
            {selectedAssistant?.name || 'Voice Assistant'}
          </Text>
          {isConnecting && (
            <ActivityIndicator size="small" color="#FFD700" style={styles.loader} />
          )}
        </View>

        {/* Visualizer & Status */}
        <View style={styles.visualizerContainer}>
          <VoiceVisualizer
            isActive={isConnected}
            mode={sessionState.mode}
            audioLevel={sessionState.audioLevel}
            vadScore={sessionState.vadScore}
          />

          <Text style={[
            styles.statusText,
            hasError && styles.errorText
          ]}>
            {getStatusText()}
          </Text>

          {isConnected && !hasError && (
            <Text style={styles.hintText}>
              Voice conversation in progress
            </Text>
          )}

          {/* Start button */}
          {isIdle && !hasError && (
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStart}
              activeOpacity={0.7}
            >
              <Text style={styles.startButtonText}>Start Session</Text>
            </TouchableOpacity>
          )}

          {/* Retry button */}
          {hasError && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleStart}
              activeOpacity={0.7}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Transcript */}
        {transcript.length > 0 && (
          <ScrollView
            ref={scrollViewRef}
            style={styles.transcriptContainer}
            contentContainerStyle={styles.transcriptContent}
            showsVerticalScrollIndicator={false}
          >
            {transcript.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.messageContainer,
                  item.source === 'agent'
                    ? styles.agentMessageContainer
                    : styles.userMessageContainer,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    item.source === 'agent'
                      ? styles.agentMessageText
                      : styles.userMessageText,
                  ]}
                >
                  {item.message}
                </Text>
                <Text style={styles.messageTime}>
                  {item.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Live Transcription */}
        <TranscriptionOverlay
          userText=""
          agentText=""
          visible={isConnected}
        />

        {/* Controls */}
        {isConnected && (
          <View style={styles.controlsContainer}>
            <View style={styles.bottomButtons}>
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
        )}
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
  startButton: {
    marginTop: 32,
    paddingHorizontal: 48,
    paddingVertical: 16,
    backgroundColor: '#FFD700',
    borderRadius: 30,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonText: {
    color: '#212121',
    fontSize: 18,
    fontWeight: '700',
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
  transcriptContainer: {
    maxHeight: 200,
    marginHorizontal: 20,
  },
  transcriptContent: {
    paddingVertical: 10,
  },
  messageContainer: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  agentMessageContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Styrene-B',
  },
  userMessageText: {
    color: '#FFD700',
  },
  agentMessageText: {
    color: COLORS.WHITE_1,
  },
  messageTime: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
    fontFamily: 'Styrene-B',
  },
});
