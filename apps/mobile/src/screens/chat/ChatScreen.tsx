import React, { useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { TextInput, IconButton, Text } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, addMessage } from '@bgos/shared-state';
import { COLORS } from '@bgos/shared-logic';

export default function ChatScreen({ route }: any) {
  const { chatId } = route.params;
  const [message, setMessage] = useState('');
  const dispatch = useDispatch();
  const chatHistory = useSelector((state: RootState) => state.chatHistory.list);

  const handleSend = () => {
    if (message.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        chatId,
        sender: 'user' as const,
        text: message,
        sentDate: new Date().toISOString(),
      };
      dispatch(addMessage(newMessage));
      setMessage('');

      // TODO: Send message to backend
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={chatHistory}
        keyExtractor={(item) => item.id || ''}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.sender === 'user' ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        )}
        contentContainerStyle={styles.messageList}
      />
      <View style={styles.inputContainer}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          style={styles.input}
          mode="outlined"
          multiline
        />
        <IconButton
          icon="send"
          size={24}
          onPress={handleSend}
          style={styles.sendButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.MAIN_BG,
  },
  messageList: {
    padding: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.PRIMARY_1,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.CARD_BG,
  },
  messageText: {
    color: COLORS.WHITE_1,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  input: {
    flex: 1,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: COLORS.PRIMARY_1,
  },
});
