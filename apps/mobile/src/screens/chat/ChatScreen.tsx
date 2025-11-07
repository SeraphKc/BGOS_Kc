import React, { useEffect, useRef } from 'react';
import { View, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { RootState } from '@bgos/shared-state';
import { COLORS } from '@bgos/shared-logic';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { MessageInput } from '../../components/chat/MessageInput';
import { useChatHistory } from '../../hooks/useChatHistory';

export default function ChatScreen({ route }: any) {
  const { chatId } = route.params;
  const flatListRef = useRef<FlatList>(null);

  const user = useSelector((state: RootState) => state.user.currentUser);
  const token = useSelector((state: RootState) => state.user.token);
  const chatHistory = useSelector((state: RootState) => state.chatHistory.list);
  const chat = useSelector((state: RootState) =>
    state.chats.list.find((c) => c.id === chatId)
  );

  const { loadChatHistory, sendMessage, loading } = useChatHistory(
    user?.id || '',
    chatId,
    token || ''
  );

  useEffect(() => {
    if (chatId !== 'new') {
      loadChatHistory();
    }
  }, [chatId, loadChatHistory]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatHistory.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatHistory.length]);

  const handleSend = async (text: string) => {
    await sendMessage(text);
  };

  if (loading && chatHistory.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator animating={true} size="large" color={COLORS.PRIMARY_1} />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {chatHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {chatId === 'new'
              ? 'Start a new conversation'
              : 'No messages yet. Send a message to get started!'}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={chatHistory}
          keyExtractor={(item) => item.id || ''}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}
      <MessageInput onSend={handleSend} disabled={loading} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.MAIN_BG,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.MAIN_BG,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.WHITE_1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontSize: 16,
  },
  messageList: {
    padding: 10,
    flexGrow: 1,
  },
});
