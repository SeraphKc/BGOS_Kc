import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
// Icon import removed - using unicode arrows instead
import { useVoiceSession } from '../../hooks/useVoiceSession';
import { TranscriptionOverlay } from './TranscriptionOverlay';
import { VoiceSphereWebView } from './VoiceSphereWebView';
import { fetchConversationTranscript, TranscriptMessage } from '../../services/elevenLabsService';
import type { TranscriptReadyPayload } from '../../contexts/VoiceAgentContext';
import { audioInitState } from '../../../App';

interface VoiceAgentModalProps {
  visible: boolean;
  onClose: () => void;
  agentId: string | undefined;
  agentName?: string;
  onTranscriptReady?: (payload: TranscriptReadyPayload) => void;
}

export const VoiceAgentModal: React.FC<VoiceAgentModalProps> = ({
  visible,
  onClose,
  agentId,
  agentName = 'Voice Assistant',
  onTranscriptReady,
}) => {
  const { sessionState, transcript, conversationId, startSession, endSession, toggleMute } = useVoiceSession({ agentId });
  const scrollViewRef = useRef<ScrollView>(null);
  const [liveUserText, setLiveUserText] = useState('');
  const [liveAgentText, setLiveAgentText] = useState('');
  const [isEndingCall, setIsEndingCall] = useState(false);
  const [waitingForInit, setWaitingForInit] = useState(false);
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(false);

  // Store conversationId in ref to access in handleEndCall after session ends
  const conversationIdRef = useRef<string | null>(null);

  // Keep conversationId ref updated
  useEffect(() => {
    if (conversationId) {
      conversationIdRef.current = conversationId;
      console.log('📝 Stored conversationId:', conversationId);
    }
  }, [conversationId]);

  // Auto-scroll transcript to bottom when new messages arrive
  useEffect(() => {
    if (transcript.length > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [transcript]);

  // Log status changes to console (removed from UI per #8)
  useEffect(() => {
    const statusText = getStatusText();
    const statusColor = getStatusColor();
    console.log(`🔊 Voice Status: ${statusText} (${statusColor})`);
  }, [sessionState.status, sessionState.isSpeaking, sessionState.isThinking, sessionState.isListening, waitingForInit]);

  // Auto-start session when modal opens - with audio initialization check
  useEffect(() => {
    if (visible && sessionState.status === 'idle') {
      const tryStartSession = async () => {
        // Wait for audio initialization if not ready
        if (!audioInitState.isInitialized) {
          setWaitingForInit(true);
          console.log('⏳ Waiting for audio initialization...');

          // Poll until initialized (max 5 seconds)
          let attempts = 0;
          while (!audioInitState.isInitialized && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
          }
          setWaitingForInit(false);

          if (!audioInitState.isInitialized) {
            console.error('❌ Audio initialization timeout');
            return;
          }
        }

        console.log('🎬 Modal opened, starting voice session...');
        try {
          await startSession();
        } catch (error) {
          console.error('❌ Failed to start voice session:', error);
        }
      };

      tryStartSession();
    }
  }, [visible, sessionState.status, startSession]);

  // Handle end call - fetch transcript and notify parent
  const handleEndCall = async () => {
    if (isEndingCall) return; // Prevent double-tap

    console.log('📞 End call button pressed');
    setIsEndingCall(true);

    // Store conversation ID before ending session
    const storedConversationId = conversationIdRef.current;
    console.log('📝 Conversation ID for transcript:', storedConversationId);

    // End the session first - wrapped in try-catch to prevent crashes
    try {
      await endSession();
    } catch (error) {
      console.error('❌ Error ending session:', error);
      // Continue anyway - session might already be ended or in bad state
    }

    // If we have a conversation ID, fetch the transcript
    if (storedConversationId && onTranscriptReady) {
      try {
        console.log('⏳ Waiting for transcript to be ready...');
        // Wait 1 second for ElevenLabs to process the transcript
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('📥 Fetching transcript from ElevenLabs...');
        const transcriptData = await fetchConversationTranscript(storedConversationId);

        console.log('✅ Transcript fetched:', transcriptData?.length, 'messages');

        // Call the callback with the transcript
        onTranscriptReady({
          conversationId: storedConversationId,
          transcript: transcriptData,
        });
      } catch (error) {
        console.error('❌ Failed to fetch transcript:', error);
        // Still call callback with just the conversationId so chat knows call ended
        onTranscriptReady({
          conversationId: storedConversationId,
          transcript: undefined,
        });
      }
    }

    // Reset state and close modal
    conversationIdRef.current = null;
    setIsEndingCall(false);
    onClose();
  };

  // Get status display text
  const getStatusText = () => {
    // Show waiting for audio init status
    if (waitingForInit) {
      return 'Waiting for audio...';
    }

    switch (sessionState.status) {
      case 'idle':
        return 'Initializing...';
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        if (sessionState.isSpeaking) return 'Agent Speaking...';
        if (sessionState.isThinking) return 'Thinking...';
        if (sessionState.isListening) return 'Listening...';
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return `Error: ${sessionState.error}`;
      default:
        return 'Unknown';
    }
  };

  // Get status color
  const getStatusColor = () => {
    switch (sessionState.status) {
      case 'connected':
        if (sessionState.isSpeaking) return '#FFD700'; // gold/yellow for speaking
        if (sessionState.isThinking) return '#8b5cf6'; // purple for thinking
        if (sessionState.isListening) return '#3b82f6'; // blue for listening
        return '#10b981'; // green for idle/connected
      case 'connecting':
        return '#f59e0b'; // orange
      case 'error':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleEndCall}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.agentName}>{agentName}</Text>
        </View>

        {/* 3D Sphere Background */}
        <View style={styles.sphereBackground}>
          <VoiceSphereWebView
            isActive={sessionState.status === 'connected'}
            mode={sessionState.mode}
            audioLevel={sessionState.audioLevel}
          />
        </View>

        {/* Main Content - Overlay */}
        <View style={styles.content}>
          {/* Status indicator when connecting */}
          <View style={styles.visualizerContainer}>
            {sessionState.status === 'connecting' && (
              <ActivityIndicator size="large" color="#FFD700" />
            )}
          </View>

  {/* Status logged to console only - not displayed in UI */}

          {/* Collapsible Transcript View */}
          {transcript.length > 0 && (
            <View style={styles.transcriptWrapper}>
              {/* Toggle Button */}
              <TouchableOpacity
                onPress={() => setIsTranscriptExpanded(!isTranscriptExpanded)}
                style={styles.transcriptToggle}
                activeOpacity={0.7}
              >
                <Text style={styles.transcriptToggleText}>
                  {isTranscriptExpanded ? 'Hide Transcript' : 'Show Transcript'}
                </Text>
                <Text style={styles.transcriptToggleArrow}>
                  {isTranscriptExpanded ? '▼' : '▲'}
                </Text>
              </TouchableOpacity>

              {/* Expandable Content */}
              {isTranscriptExpanded && (
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
            </View>
          )}

{/* Debug info logged to console only */}
        </View>

        {/* Live Transcription Overlay */}
        <TranscriptionOverlay
          userText={liveUserText}
          agentText={liveAgentText}
          visible={sessionState.status === 'connected'}
        />

        {/* Footer with Control Buttons */}
        <View style={styles.footer}>
          <View style={styles.buttonRow}>
            {/* Mute Button */}
            <TouchableOpacity
              onPress={toggleMute}
              style={[styles.controlButton, sessionState.isMuted && styles.controlButtonMuted]}
              activeOpacity={0.7}
              disabled={sessionState.status !== 'connected'}
            >
              <Image
                source={require('../../assets/s2s-voice-button.png')}
                style={[styles.buttonIcon, sessionState.isMuted && styles.mutedIcon]}
              />
            </TouchableOpacity>

            {/* End Call Button */}
            <TouchableOpacity
              onPress={handleEndCall}
              style={styles.controlButton}
              activeOpacity={0.7}
              disabled={isEndingCall}
            >
              {isEndingCall ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Image
                  source={require('../../assets/s2s-cancel-button.png')}
                  style={styles.buttonIcon}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Mute Status Text */}
          {sessionState.isMuted && (
            <Text style={styles.muteStatusText}>Microphone Muted</Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(38, 38, 36)',
  },
  sphereBackground: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    justifyContent: 'space-between',
  },
  visualizerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgb(38, 38, 36)',
  },
  loadingText: {
    color: '#FFD700',
    fontSize: 18,
    marginTop: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(38, 38, 36, 0.9)',
    zIndex: 10,
  },
  agentName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(38, 38, 36, 0.8)',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  spacer: {
    flex: 1,
  },
  transcriptContainer: {
    maxHeight: 200,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(38, 38, 36, 0.9)',
    borderRadius: 12,
  },
  transcriptContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '85%',
    padding: 10,
    borderRadius: 12,
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(55, 65, 81, 0.9)',
  },
  agentMessageContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 2,
  },
  userMessageText: {
    color: '#ffffff',
  },
  agentMessageText: {
    color: '#FFD700',
  },
  messageTime: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
    backgroundColor: 'rgba(38, 38, 36, 0.9)',
    zIndex: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  controlButtonMuted: {
    opacity: 0.6,
  },
  buttonIcon: {
    width: 64,
    height: 64,
    resizeMode: 'contain',
  },
  mutedIcon: {
    opacity: 0.5,
  },
  muteStatusText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
  transcriptWrapper: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  transcriptToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(38, 38, 36, 0.95)',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  transcriptToggleText: {
    color: '#FFD700',
    fontSize: 14,
    marginRight: 8,
    fontWeight: '500',
  },
  transcriptToggleArrow: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '500',
  },
});
