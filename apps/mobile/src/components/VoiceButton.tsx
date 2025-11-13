/**
 * VoiceButton Component
 *
 * Yellow circular button for initiating voice-to-voice conversations
 * Displays different states: idle, recording, processing, playing
 */

import React from 'react';
import { TouchableOpacity, StyleSheet, View, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import type { RootState } from '@bgos/shared-state';
import MicrophoneIcon from './icons/MicrophoneIcon';

interface VoiceButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

const VoiceButton: React.FC<VoiceButtonProps> = ({ onPress, disabled = false }) => {
  const voiceStatus = useSelector((state: RootState) => state.voice.status);

  const isActive = voiceStatus !== 'idle';
  const isProcessing = voiceStatus === 'connecting' || voiceStatus === 'processing';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isActive && styles.buttonActive,
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {isProcessing ? (
        <ActivityIndicator size="small" color="#000000" />
      ) : (
        <MicrophoneIcon color={isActive ? '#000000' : '#FFD700'} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default VoiceButton;
