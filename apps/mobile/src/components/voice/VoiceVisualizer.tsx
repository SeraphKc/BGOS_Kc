import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

interface VoiceVisualizerProps {
  isActive: boolean;
  mode: 'idle' | 'listening' | 'speaking' | 'thinking';
  audioLevel?: number; // 0-1 representing audio intensity
  vadScore?: number; // Voice Activity Detection score 0-1
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  isActive,
  mode,
  audioLevel = 0,
  vadScore = 0,
}) => {
  // Create animated values for multiple bars
  const bar1 = useRef(new Animated.Value(0.3)).current;
  const bar2 = useRef(new Animated.Value(0.5)).current;
  const bar3 = useRef(new Animated.Value(0.7)).current;
  const bar4 = useRef(new Animated.Value(0.5)).current;
  const bar5 = useRef(new Animated.Value(0.3)).current;

  const bars = [bar1, bar2, bar3, bar4, bar5];

  // Use audioLevel to drive reactive animation
  useEffect(() => {
    if (isActive && audioLevel > 0.1) {
      // React to audio level changes
      const intensity = Math.max(0.2, Math.min(0.9, audioLevel));
      bars.forEach((bar, index) => {
        const variance = (Math.random() - 0.5) * 0.2;
        Animated.spring(bar, {
          toValue: intensity + variance,
          useNativeDriver: false,
          friction: 8,
          tension: 40,
        }).start();
      });
    }
  }, [audioLevel, isActive]);

  useEffect(() => {
    if (!isActive) {
      // Reset to idle state
      bars.forEach((bar) => {
        bar.setValue(0.3); // Direct set value instead of animation to prevent JS thread blocking
      });
      return;
    }

    // Create animations based on mode
    // Simplified animation for stability
    const animations = bars.map((bar, index) => {
         return Animated.loop(
          Animated.sequence([
            Animated.timing(bar, {
              toValue: 0.6,
              duration: 1000,
              useNativeDriver: false, // Native driver might crash if view is detached
            }),
            Animated.timing(bar, {
              toValue: 0.3,
              duration: 1000,
              useNativeDriver: false,
            }),
          ])
        );
    });

    // Start all animations
    animations.forEach((anim) => anim.start());

    // Cleanup
    return () => {
      animations.forEach((anim) => anim.stop());
    };
  }, [isActive, mode]);

  // Get bar color based on mode
  const getBarColor = () => {
    switch (mode) {
      case 'listening':
        return '#3b82f6'; // Blue
      case 'speaking':
        return '#FFD700'; // Gold/Yellow
      case 'thinking':
        return '#8b5cf6'; // Purple
      case 'idle':
      default:
        return '#6b7280'; // Gray
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.visualizer}>
        {bars.map((bar, index) => (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              {
                backgroundColor: getBarColor(),
                height: bar.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['10%', '80%'],
                }),
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visualizer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    gap: 12,
  },
  bar: {
    width: 8,
    borderRadius: 4,
    // backgroundColor is set dynamically based on mode
  },
});
