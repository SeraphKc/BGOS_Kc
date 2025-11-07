import React, { useState } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { IconButton } from 'react-native-paper';
import { COLORS } from '@bgos/shared-logic';

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
}) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255, 255, 255, 0.5)"
        style={styles.input}
        multiline
        maxLength={2000}
        editable={!disabled}
        onSubmitEditing={handleSend}
      />
      <IconButton
        icon="send"
        size={24}
        onPress={handleSend}
        disabled={!text.trim() || disabled}
        iconColor={text.trim() && !disabled ? COLORS.PRIMARY_1 : 'rgba(255, 255, 255, 0.3)'}
        style={styles.sendButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    backgroundColor: COLORS.MAIN_BG,
  },
  input: {
    flex: 1,
    marginRight: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.INPUT_BG,
    borderRadius: 20,
    color: COLORS.WHITE_1,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    margin: 0,
  },
});
