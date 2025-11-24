import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface TranscriptionOverlayProps {
  userText: string;
  agentText: string;
  visible: boolean;
}

export const TranscriptionOverlay: React.FC<TranscriptionOverlayProps> = ({
  userText,
  agentText,
  visible,
}) => {
  const [opacity] = useState(new Animated.Value(0));

  // Auto fade-in/out based on visibility
  useEffect(() => {
    if (visible && (userText || agentText)) {
      // Fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Fade out
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, userText, agentText, opacity]);

  // Don't render if both texts are empty
  if (!userText && !agentText) {
    return null;
  }

  // Prioritize agent text over user text (show agent when speaking)
  const displayText = agentText || userText;
  const isAgent = !!agentText;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={styles.captionBox}>
        <Text
          style={[
            styles.captionText,
            isAgent ? styles.agentText : styles.userText,
          ]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {displayText}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  captionBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    maxWidth: '90%',
  },
  captionText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },
  userText: {
    color: '#ffffff',
  },
  agentText: {
    color: '#FFD700', // Gold/yellow for agent
  },
});
