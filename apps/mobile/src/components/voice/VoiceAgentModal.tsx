import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useVoiceSession } from '../../hooks/useVoiceSession';
import { TranscriptionOverlay } from './TranscriptionOverlay';
import { VoiceVisualizer } from './VoiceVisualizer';

interface VoiceAgentModalProps {
  visible: boolean;
  onClose: () => void;
  agentId: string | undefined;
  agentName?: string;
}

export const VoiceAgentModal: React.FC<VoiceAgentModalProps> = ({
  visible,
  onClose,
  agentId,
  agentName = 'Voice Assistant',
}) => {
  const { sessionState, transcript, startSession, endSession } = useVoiceSession({ agentId });
  const scrollViewRef = useRef<ScrollView>(null);
  const [liveUserText, setLiveUserText] = useState('');
  const [liveAgentText, setLiveAgentText] = useState('');

  // Auto-scroll transcript to bottom when new messages arrive
  useEffect(() => {
    if (transcript.length > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [transcript]);

  // Auto-start session when modal opens
  useEffect(() => {
    if (visible && sessionState.status === 'idle') {
      console.log('🎬 Modal opened, starting voice session...');
      startSession();
    }
  }, [visible, sessionState.status, startSession]);

  // Handle end call
  const handleEndCall = async () => {
    console.log('📞 End call button pressed');
    await endSession();
    onClose();
  };

  // Get status display text
  const getStatusText = () => {
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

        {/* Main Content */}
        <View style={styles.content}>
          {/* Voice Visualizer */}
          <View style={styles.visualizerContainer}>
            {sessionState.status === 'connecting' ? (
              <ActivityIndicator size="large" color="#3b82f6" />
            ) : (
              <VoiceVisualizer
                isActive={sessionState.status === 'connected'}
                mode={sessionState.mode}
                audioLevel={sessionState.audioLevel}
                vadScore={sessionState.vadScore}
              />
            )}
          </View>

          {/* Status Text */}
          <View style={styles.statusContainer}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>

          {/* Transcript View */}
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

          {/* Debug Info - Only show when no transcript */}
          {transcript.length === 0 && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugText}>Mode: {sessionState.mode}</Text>
              <Text style={styles.debugText}>
                Audio Level: {Math.round(sessionState.audioLevel * 100)}%
              </Text>
              {sessionState.conversationId && (
                <Text style={styles.debugText}>
                  Conversation ID: {sessionState.conversationId.substring(0, 12)}...
                </Text>
              )}
              {sessionState.error && (
                <Text style={[styles.debugText, styles.errorText]}>
                  Error: {sessionState.error}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Live Transcription Overlay */}
        <TranscriptionOverlay
          userText={liveUserText}
          agentText={liveAgentText}
          visible={sessionState.status === 'connected'}
        />

        {/* Footer with End Call Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.endCallButton}
            onPress={handleEndCall}
            activeOpacity={0.7}
          >
            <Text style={styles.endCallText}>End Call</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  agentName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  visualizerContainer: {
    height: 200,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  transcriptContainer: {
    flex: 1,
    width: '100%',
    marginTop: 20,
  },
  transcriptContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    backgroundColor: '#374151',
  },
  agentMessageContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 215, 0, 0.15)', // Subtle gold tint
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  userMessageText: {
    color: '#ffffff',
  },
  agentMessageText: {
    color: '#FFD700', // Gold/yellow
  },
  messageTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  debugContainer: {
    backgroundColor: '#1f2937',
    padding: 20,
    borderRadius: 10,
    width: '100%',
    maxWidth: 400,
  },
  debugText: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  errorText: {
    color: '#ef4444',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  endCallButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endCallText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
