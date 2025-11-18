import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Vibration,
} from 'react-native';
import { COLORS } from '@bgos/shared-logic';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const slideAnim = useRef(new Animated.Value(100)).current;
  const sendPulseAnim = useRef(new Animated.Value(1)).current;
  const waveformAnims = useRef(
    Array.from({ length: 25 }, () => new Animated.Value(0.3))
  ).current;

  // Entry animation
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 65,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  // Pulse effect on send button
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(sendPulseAnim, {
          toValue: 1.08,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(sendPulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, [sendPulseAnim]);

  // Animate waveform bars based on audio level
  useEffect(() => {
    waveformAnims.forEach((anim, index) => {
      // Create variation for each bar
      const variation = (Math.sin(index * 0.5) + 1) / 2; // 0 to 1
      const targetValue = audioLevel > 0.05
        ? audioLevel * (0.7 + variation * 0.3) // Reactive to audio when there's sound
        : 0.1 + Math.random() * 0.05; // Minimal dots when silent

      Animated.timing(anim, {
        toValue: targetValue,
        duration: 150,
        useNativeDriver: false,
      }).start();
    });
  }, [audioLevel, waveformAnims]);

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Haptic feedback handlers
  const handleCancelPress = () => {
    // Light vibration for cancel
    Vibration.vibrate(10);
    onCancel();
  };

  const handleConfirmPress = () => {
    // Stronger vibration for confirm/send
    Vibration.vibrate(20);
    onConfirm();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Gradient overlay for subtle depth */}
      <View style={styles.gradientOverlay} />

      {/* Cancel button - simple */}
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={handleCancelPress}
        activeOpacity={0.7}
      >
        <Text style={styles.cancelIcon}>×</Text>
      </TouchableOpacity>

      {/* Waveform bars */}
      <View style={styles.waveformContainer}>
        {waveformAnims.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.waveformBar,
              {
                height: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [4, 36], // 4px dots when silent, up to 36px when loud
                }),
              },
            ]}
          />
        ))}
      </View>

      {/* Duration */}
      <Text style={styles.duration}>{formatDuration(duration)}</Text>

      {/* Send button with pulse */}
      <Animated.View style={{ transform: [{ scale: sendPulseAnim }] }}>
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleConfirmPress}
          activeOpacity={0.7}
        >
          <View style={styles.sendIconContainer}>
            <Text style={styles.sendIcon}>↑</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(48, 48, 46, 0.95)', // Semi-transparent for blur-like effect
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: 'rgba(255, 217, 0, 0.2)', // Subtle yellow border
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 12,
    // Additional depth with backdrop
    backdropFilter: 'blur(10px)', // For web support
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(58, 58, 54, 0.2)', // Subtle gradient overlay
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  cancelButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgb(15, 16, 13)', // User message background color
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  cancelIcon: {
    color: '#FFFFFF', // White X
    fontSize: 30,
    fontWeight: '400',
    lineHeight: 30,
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    gap: 2,
  },
  waveformBar: {
    width: 3,
    backgroundColor: COLORS.PRIMARY_1, // Yellow bars
    borderRadius: 1.5,
    minHeight: 4,
  },
  duration: {
    color: COLORS.PRIMARY_1, // Yellow text
    fontSize: 16,
    fontFamily: 'Styrene-B',
    fontWeight: '600',
    marginLeft: 12,
    marginRight: 12,
    minWidth: 50,
    textAlign: 'center',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.PRIMARY_1, // Yellow background
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)', // Subtle white border for contrast
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sendIconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    color: '#FFFFFF', // White arrow
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 24,
    textAlign: 'center',
    marginTop: -2, // Fine-tune vertical centering
  },
});
