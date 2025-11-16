import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useVoiceSession } from '../../hooks/useVoiceSession';

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
  const { sessionState, startSession, endSession } = useVoiceSession({ agentId });

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
        if (sessionState.isSpeaking) return '#10b981'; // green
        if (sessionState.isListening) return '#3b82f6'; // blue
        return '#10b981';
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
          {/* Status Indicator */}
          <View style={styles.statusContainer}>
            {sessionState.status === 'connecting' && (
              <ActivityIndicator size="large" color="#3b82f6" />
            )}
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor() },
              ]}
            />
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>

          {/* Debug Info */}
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>Status: {sessionState.status}</Text>
            <Text style={styles.debugText}>
              Is Speaking: {sessionState.isSpeaking ? 'Yes' : 'No'}
            </Text>
            <Text style={styles.debugText}>
              Is Listening: {sessionState.isListening ? 'Yes' : 'No'}
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
        </View>

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
  statusContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  statusDot: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginVertical: 20,
  },
  statusText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 10,
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
