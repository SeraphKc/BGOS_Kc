import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Animated } from 'react-native';
import { COLORS } from '@bgos/shared-logic';

interface VoiceRecordingInterfaceProps {
  duration: number;
  audioLevel: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export const VoiceRecordingInterface: React.FC<VoiceRecordingInterfaceProps> = ({
  duration,
  audioLevel,
  onCancel,
  onConfirm,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulsing animation for recording indicator
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, [pulseAnim]);

  // Format duration as M:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate waveform bars based on audio level
  const generateWaveform = (): number[] => {
    // Generate 40 bars for the waveform
    const bars: number[] = [];
    for (let i = 0; i < 40; i++) {
      // Create varying heights based on audio level with some randomness
      const variation = Math.random() * 0.3;
      const height = Math.max(0.2, Math.min(1, audioLevel + variation - 0.15));
      bars.push(height);
    }
    return bars;
  };

  const waveformBars = generateWaveform();

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Recording indicator */}
        <View style={styles.headerRow}>
          <Animated.View
            style={[
              styles.recordingDot,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
          <Text style={styles.recordingText}>Recording</Text>
          <Text style={styles.duration}>{formatDuration(duration)}</Text>
        </View>

        {/* Waveform visualization */}
        <View style={styles.waveformContainer}>
          {waveformBars.map((height, index) => (
            <View
              key={index}
              style={[
                styles.waveformBar,
                {
                  height: Math.max(4, height * 42), // Min 4px, max 42px (like desktop)
                },
              ]}
            />
          ))}
        </View>

        {/* Action buttons */}
        <View style={styles.buttonRow}>
          {/* Cancel button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelIcon}>×</Text>
          </TouchableOpacity>

          {/* Confirm button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.confirmButton]}
            onPress={onConfirm}
            activeOpacity={0.7}
          >
            <Text style={styles.confirmIcon}>✓</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    width: '85%',
    backgroundColor: COLORS.INPUT_BG,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF4444',
    marginRight: 8,
  },
  recordingText: {
    color: COLORS.WHITE_1,
    fontSize: 16,
    fontFamily: 'Styrene-B',
    marginRight: 12,
  },
  duration: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontFamily: 'Styrene-B',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    width: '100%',
    marginBottom: 24,
  },
  waveformBar: {
    width: 3,
    backgroundColor: '#FFD700',
    marginHorizontal: 1.5,
    borderRadius: 1.5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FF4444',
  },
  confirmButton: {
    backgroundColor: '#FFD700',
  },
  cancelIcon: {
    color: COLORS.WHITE_1,
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: -4,
  },
  confirmIcon: {
    color: COLORS.MAIN_BG,
    fontSize: 28,
    fontWeight: 'bold',
  },
});
