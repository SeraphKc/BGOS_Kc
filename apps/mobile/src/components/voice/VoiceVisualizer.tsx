import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

interface VoiceVisualizerProps {
  isActive: boolean;
  mode: 'idle' | 'listening' | 'thinking';
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ isActive, mode }) => {
  // Create animated values for multiple bars
  const bar1 = useRef(new Animated.Value(0.3)).current;
  const bar2 = useRef(new Animated.Value(0.5)).current;
  const bar3 = useRef(new Animated.Value(0.7)).current;
  const bar4 = useRef(new Animated.Value(0.5)).current;
  const bar5 = useRef(new Animated.Value(0.3)).current;

  const bars = [bar1, bar2, bar3, bar4, bar5];

  useEffect(() => {
    if (!isActive) {
      // Reset to idle state
      bars.forEach((bar) => {
        Animated.timing(bar, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: false,
        }).start();
      });
      return;
    }

    // Create animations based on mode
    const animations = bars.map((bar, index) => {
      if (mode === 'idle') {
        // Gentle pulsing
        return Animated.loop(
          Animated.sequence([
            Animated.timing(bar, {
              toValue: 0.4,
              duration: 1000 + index * 200,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.timing(bar, {
              toValue: 0.3,
              duration: 1000 + index * 200,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
          ])
        );
      } else if (mode === 'listening') {
        // Active listening - more dynamic
        return Animated.loop(
          Animated.sequence([
            Animated.timing(bar, {
              toValue: 0.2 + Math.random() * 0.6,
              duration: 200 + index * 50,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.timing(bar, {
              toValue: 0.2 + Math.random() * 0.5,
              duration: 200 + index * 50,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
          ])
        );
      } else {
        // Thinking - medium pulsing
        return Animated.loop(
          Animated.sequence([
            Animated.timing(bar, {
              toValue: 0.6,
              duration: 800 + index * 100,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.timing(bar, {
              toValue: 0.4,
              duration: 800 + index * 100,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
          ])
        );
      }
    });

    // Start all animations
    animations.forEach((anim) => anim.start());

    // Cleanup
    return () => {
      animations.forEach((anim) => anim.stop());
    };
  }, [isActive, mode]);

  return (
    <View style={styles.container}>
      <View style={styles.visualizer}>
        {bars.map((bar, index) => (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              {
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
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
});
