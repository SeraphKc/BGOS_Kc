import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { ChatHistory } from '@bgos/shared-types';
import { COLORS } from '@bgos/shared-logic';

interface MessageBubbleProps {
  message: ChatHistory;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  return (
    <View
      style={[
        styles.messageBubble,
        isUser ? styles.userBubble : styles.assistantBubble,
      ]}
    >
      <Text style={[styles.messageText, isUser && styles.userText]}>
        {message.text}
      </Text>
      {message.sentDate && (
        <Text style={styles.timeText}>
          {new Date(message.sentDate).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.PRIMARY_1,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.CARD_BG,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: COLORS.WHITE_1,
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: COLORS.DARK_1,
  },
  timeText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
});
