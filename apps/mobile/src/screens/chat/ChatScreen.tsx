import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { View, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AssistantActions, ChatHistoryActions, ChatActions } from '@bgos/shared-state';
import { COLORS, getInitials, getAvatarColor } from '@bgos/shared-logic';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { MessageInput } from '../../components/chat/MessageInput';
import { LoadingIndicator } from '../../components/chat/LoadingIndicator';
import { useChatHistory } from '../../hooks/useChatHistory';
import AgentSelectorDropdown from '../../components/chat/AgentSelectorDropdown';
import { fetchChats } from '../../services/chatService';
import { fetchConversationTranscript } from '../../services/elevenLabsService';
import { NewChatIcon } from '../../components/icons/NewChatIcon';
import { useVoiceAgentModal, TranscriptReadyPayload } from '../../contexts/VoiceAgentContext';
import Logo from '../../assets/logo.svg';

// Time-based greeting function (from desktop ChatArea.tsx)
const getTimeBasedGreeting = (fullName: string): string => {
  const hour = new Date().getHours();
  const firstName = fullName.split(' ')[0];

  if (hour >= 0 && hour < 5) {
    return `Burning the midnight oil, ${firstName}?`;
  } else if (hour >= 5 && hour < 12) {
    return `Good morning, ${firstName}`;
  } else if (hour >= 12 && hour < 18) {
    return `Good afternoon, ${firstName}`;
  } else {
    return `Good evening, ${firstName}`;
  }
};

export default function ChatScreen({ route, navigation }: any) {
  const { chatId } = route.params;
  const flatListRef = useRef<FlatList>(null);
  const prevChatIdRef = useRef(chatId);
  const dispatch = useDispatch();
  const [fetchingTranscript, setFetchingTranscript] = useState(false);
  const hasAutoSelectedRef = useRef(false); // Track if we've already auto-selected

  // Use voice agent context
  const { setTranscriptReadyHandler } = useVoiceAgentModal();

  const user = useSelector((state: RootState) => state.user.currentUser);
  const token = useSelector((state: RootState) => state.user.token);
  const chatHistory = useSelector((state: RootState) => state.chatHistory.list);
  const assistants = useSelector((state: RootState) => state.assistants.list);
  const selectedAssistantId = useSelector((state: RootState) => state.assistants.selectedAssistantId);

  // Filter messages for current chat only
  const filteredMessages = useMemo(() => {
    return chatHistory.filter(message => message.chatId === chatId);
  }, [chatHistory, chatId]);

  // Debug logging for chat history - DISABLED to prevent unnecessary re-renders
  // useEffect(() => {
  //   console.log('ChatScreen - chatHistory updated:', {
  //     totalCount: chatHistory.length,
  //     filteredCount: filteredMessages.length,
  //     currentChatId: chatId,
  //   });
  // }, [chatHistory, chatId, filteredMessages]);
  const selectedAssistant = useSelector((state: RootState) =>
    state.assistants.list.find((a) => a.id === selectedAssistantId)
  );
  const chat = useSelector((state: RootState) =>
    state.chats.list.find((c) => c.id === chatId)
  );

  const { loadChatHistory, sendMessage, sendMessageWithChatId, createNewChat, loading, creatingChat } = useChatHistory(
    user?.id || '',
    chatId,
    token || '',
    selectedAssistant?.webhookUrl,
    selectedAssistantId || undefined
  );

  // Default agent selection for new chats
  // NOTE: Removed 'assistants' from dependencies to prevent re-triggering when assistants array reference changes
  // This effect should ONLY run when chatId changes or selectedAssistantId changes
  // Uses hasAutoSelectedRef to prevent re-selection after initial auto-select
  useEffect(() => {
    // Only auto-select if we haven't already done so AND no assistant is currently selected
    // This prevents re-selection when modal opens/closes
    if (chatId === 'new' && !selectedAssistantId && assistants.length > 0 && !hasAutoSelectedRef.current) {
      console.log('🟢 ChatScreen - Auto-selecting first assistant:', assistants[0].id);
      dispatch(AssistantActions.setSelectedAssistant(assistants[0].id));
      hasAutoSelectedRef.current = true; // Mark that we've auto-selected
    }

    // Reset flag when navigating away from 'new' chat
    if (chatId !== 'new') {
      hasAutoSelectedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, selectedAssistantId, dispatch]);

  useEffect(() => {
    const prevChatId = prevChatIdRef.current;
    prevChatIdRef.current = chatId;

    // Skip loading if we just transitioned from 'new' to a real chatId
    // This prevents wiping out the first message before backend processes it
    if (prevChatId === 'new' && chatId !== 'new') {
      console.log('Skipping loadChatHistory - just sent first message');
      return;
    }

    if (chatId !== 'new') {
      loadChatHistory();
    }
  }, [chatId, loadChatHistory]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (filteredMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [filteredMessages.length]);

  const handleSend = useCallback(async (text: string, files?: any[], voiceData?: any) => {
    console.log('🔵 ChatScreen.handleSend - START', {
      text,
      textLength: text?.length || 0,
      hasFiles: !!(files && files.length > 0),
      hasVoiceData: !!voiceData,
      chatId,
      selectedAssistantId,
    });

    // Check if this is a new chat (needs to be created on backend first)
    const isNewChat = chatId === 'new';

    if (isNewChat) {
      console.log('🟡 New chat detected - showing user message immediately');

      // Determine the first message text for chat creation
      const firstMessageText = text.trim() ||
        (files && files.length > 0 ? `[${files.length} file(s) attached]` : '') ||
        (voiceData ? '[Voice message]' : '');

      if (!firstMessageText) {
        console.error('Cannot create chat: no content provided');
        return;
      }

      // Step 1: Show user message IMMEDIATELY with temporary 'new' chatId
      // IMPORTANT: Preserve the text exactly as received to avoid losing it
      const messageText = text?.trim() || (files && files.length > 0 ? '[File(s) attached]' : '[Voice message]');

      const tempUserMessage: any = {
        id: `temp-user-${Date.now()}`,
        chatId: 'new', // Use 'new' so it displays immediately
        sender: 'user' as const,
        text: messageText,
        sentDate: new Date().toISOString(),
        hasAttachment: !!(files && files.length > 0),
        files: files || [],
      };

      // Validate that we have text
      if (!tempUserMessage.text || tempUserMessage.text.length === 0) {
        console.error('❌ BUG: tempUserMessage.text is empty!', {
          receivedText: text,
          trimmedText: text?.trim(),
          messageText,
          hasFiles: !!(files && files.length),
          hasVoiceData: !!voiceData,
        });
      }

      // Add voice data if present
      if (voiceData) {
        tempUserMessage.isAudio = true;
        tempUserMessage.audioData = voiceData.audioData;
        tempUserMessage.audioFileName = voiceData.audioFileName;
        tempUserMessage.audioMimeType = voiceData.audioMimeType;
        tempUserMessage.duration = voiceData.duration;
      }

      console.log('🟢 ChatScreen - Adding temp user message to Redux:', {
        id: tempUserMessage.id,
        chatId: tempUserMessage.chatId,
        text: tempUserMessage.text,
        textLength: tempUserMessage.text?.length || 0,
        fullMessage: JSON.stringify(tempUserMessage),
      });
      dispatch(ChatHistoryActions.addMessage(tempUserMessage));

      // Step 2: Create chat on backend (in background)
      const newChat = await createNewChat(firstMessageText);

      if (!newChat || !newChat.id) {
        console.error('Failed to create chat on backend');
        return; // Error message already shown by createNewChat
      }

      console.log('Chat created successfully with ID:', newChat.id);

      // Step 3: Add the new chat to Redux state
      dispatch(ChatActions.pushChat(newChat));

      // Step 4: Update the user message's chatId to the new chatId FIRST
      // (Must happen before navigation to avoid race condition where message gets filtered out)
      dispatch(ChatHistoryActions.updateMessage({
        id: tempUserMessage.id,
        updates: { chatId: newChat.id }
      }));

      // Step 5: Navigate to the new chat (triggers re-render with correct chatId)
      navigation.setParams({ chatId: newChat.id });

      // Step 6: Send message to webhook for AI response (in background)
      // Skip adding user message again since we already added it in Step 1
      await sendMessageWithChatId(text, files, voiceData, newChat.id, true);

    } else {
      // Existing chat - send message normally
      await sendMessage(text, files, voiceData);
    }
  }, [chatId, selectedAssistantId, createNewChat, sendMessageWithChatId, sendMessage, dispatch, navigation]);

  const handleTranscriptReady = useCallback(async ({
    conversationId,
    transcript,
  }: TranscriptReadyPayload) => {
    console.log('ChatScreen - Transcript ready for conversation:', conversationId);
    try {
      setFetchingTranscript(true);

      let resolvedTranscript = transcript;

      if (!resolvedTranscript) {
        // Wait 3 seconds for server processing (matching desktop retry logic)
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Fetch transcript from ElevenLabs
        resolvedTranscript = await fetchConversationTranscript(conversationId);
      }

      // Add transcript messages to chat history
      resolvedTranscript.forEach((msg) => {
        const tempMessage = {
          id: `transcript-${Date.now()}-${Math.random()}`,
          chatId,
          sender: msg.role === 'user' ? ('user' as const) : ('assistant' as const),
          text: msg.message,
          sentDate: msg.timestamp || new Date().toISOString(),
        };

        dispatch(ChatHistoryActions.addMessage(tempMessage));
      });

      setFetchingTranscript(false);
    } catch (error: any) {
      setFetchingTranscript(false);
      console.error('Failed to fetch transcript:', error);
    }
  }, [chatId, dispatch]);

  // Set transcript handler in context when chatId changes
  useEffect(() => {
    console.log('ChatScreen - Setting transcript handler for chatId:', chatId);
    setTranscriptReadyHandler(handleTranscriptReady);
  }, [chatId, setTranscriptReadyHandler, handleTranscriptReady]);

  if (loading && filteredMessages.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator animating={true} size="large" color={COLORS.PRIMARY_1} />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  // Show greeting for new chats (removed selectedAssistant requirement)
  const showGreeting = chatId === 'new' && filteredMessages.length === 0;
  const greeting = user?.name ? getTimeBasedGreeting(user.name) : 'Welcome to BGOS';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header with hamburger menu, agent selector, and new chat button */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.hamburgerButton}
          onPress={() => navigation.openDrawer()}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>≡</Text>
        </TouchableOpacity>

        <View style={styles.agentSelectorContainer}>
          <AgentSelectorDropdown />
        </View>

        {/* New Chat Button */}
        <TouchableOpacity
          style={styles.newChatButton}
          onPress={() => {
            // Navigate to new chat with current assistant pre-selected
            navigation.setParams({ chatId: 'new' });
          }}
          activeOpacity={0.7}
        >
          <NewChatIcon size={18} color="rgba(255, 255, 255, 0.6)" />
        </TouchableOpacity>
      </View>

      {showGreeting ? (
        <View style={styles.greetingContainer}>
          {/* Logo above greeting */}
          <Logo
            width={120}
            height={30}
            fill="#FFD700"
            style={styles.greetingLogo}
          />

          {/* Elegant personalized greeting */}
          <Text style={styles.greetingText}>{greeting}</Text>

          {/* Show assistant info if available */}
          {selectedAssistant && (
            <View style={styles.assistantInfo}>
              {selectedAssistant.avatarUrl ? (
                <Image
                  source={{ uri: selectedAssistant.avatarUrl }}
                  style={styles.smallAvatar}
                />
              ) : (
                <View style={[
                  styles.smallAvatar,
                  { backgroundColor: getAvatarColor(selectedAssistant.name) }
                ]}>
                  <Text style={styles.smallAvatarText}>
                    {getInitials(selectedAssistant.name)}
                  </Text>
                </View>
              )}
              <Text style={styles.assistantLabel}>
                Chatting with {selectedAssistant.name}
              </Text>
            </View>
          )}
        </View>
      ) : filteredMessages.length === 0 ? (
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
          data={filteredMessages}
          keyExtractor={(item) => item.id || ''}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            loading ? <LoadingIndicator visible={loading} /> : null
          }
        />
      )}
      <MessageInput
        onSend={handleSend}
        disabled={creatingChat || fetchingTranscript || (chatId === 'new' && !selectedAssistantId)}
        chatId={chatId}
        placeholder={chatId === 'new' && !selectedAssistantId ? 'Loading assistant...' : 'Type a message...'}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.MAIN_BG,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.MAIN_BG,
  },
  hamburgerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentSelectorContainer: {
    flex: 1,
    alignItems: 'center',
  },
  newChatButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 24,
    color: COLORS.WHITE_1,
  },
  greetingLogo: {
    marginBottom: 24,
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
    fontFamily: 'Styrene-B',
  },
  greetingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  greetingText: {
    fontSize: 32,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'Styrene-B',
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  assistantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Styrene-B',
  },
  assistantLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'Styrene-B',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.WHITE_1,
    fontSize: 16,
    fontFamily: 'Styrene-B',
  },
  messageList: {
    flexGrow: 1,
    padding: 16,
  },
});
