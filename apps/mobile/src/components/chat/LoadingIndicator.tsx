import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated, Image, Text, Easing } from 'react-native';
import { COLORS } from '@bgos/shared-logic';

const THINKING_MESSAGES = [
  'Thinking...',
  "I'm still on it...",
  'Almost there...',
  'Taking a bit more time...',
];

interface LoadingIndicatorProps {
  visible: boolean;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ visible }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const pulseValue = useRef(new Animated.Value(1)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Start heartbeat/pulse animation (enlarge and shrink)
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.2, // Enlarge to 120%
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1, // Shrink back to 100%
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start slow rotation animation
      Animated.loop(
        Animated.timing(rotateValue, {
          toValue: 1,
          duration: 3000, // 3 seconds for full rotation (slow)
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // Cycle through thinking messages every 5 seconds
      const messageInterval = setInterval(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % THINKING_MESSAGES.length);
      }, 5000);

      return () => {
        clearInterval(messageInterval);
      };
    }
  }, [visible, pulseValue, rotateValue]);

  // Fade in/out animation for message text
  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.delay(4000), // Show for 4 seconds
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentMessageIndex, visible, fadeAnim]);

  if (!visible) {
    return null;
  }

  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        {/* Pulsing and rotating logo (heartbeat + slow rotation) */}
        {/* Fixed container to prevent orbital motion */}
        <View style={styles.logoContainer}>
          {/* Outer View handles scale (heartbeat) */}
          <Animated.View style={{ transform: [{ scale: pulseValue }] }}>
            {/* Inner View handles rotation */}
            <Animated.View style={{ transform: [{ rotate: rotate }] }}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </Animated.View>
          </Animated.View>
        </View>

        {/* Thinking message with fade animation */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.thinkingText}>
            {THINKING_MESSAGES[currentMessageIndex]}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  logoContainer: {
    width: 24,
    height: 24,
    marginRight: 20, // Increased spacing so pulsing logo doesn't cover text
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 24,
    height: 24,
  },
  thinkingText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'Styrene-B',
  },
});
