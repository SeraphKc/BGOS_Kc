import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Animated } from 'react-native';
import { ChatHistory } from '@bgos/shared-types';
import { COLORS, getInitials, getAvatarColor } from '@bgos/shared-logic';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import { useSelector } from 'react-redux';
import { RootState } from '@bgos/shared-state';
import Markdown from 'react-native-markdown-display';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import { CopyIcon } from './CopyIcon';
import { AnimatedCheckmark } from './AnimatedCheckmark';
import Logo from '../../assets/logo.svg';

interface MessageBubbleProps {
  message: ChatHistory;
  isLastAssistantMessage?: boolean;
  assistantName?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isLastAssistantMessage = false,
  assistantName = 'Assistant',
}) => {
  const isUser = message.sender === 'user';
  const user = useSelector((state: RootState) => state.user.currentUser);
  const [copied, setCopied] = useState(false);
  const isQueued = message.status === 'queued';

  const handleCopy = () => {
    if (message.text) {
      Clipboard.setString(message.text);
      setCopied(true);

      // Show toast notification
      Toast.show({
        type: 'success',
        text1: 'Copied to clipboard',
        position: 'bottom',
        visibilityTime: 2000,
        bottomOffset: 100,
      });

      setTimeout(() => setCopied(false), 1000);
    }
  };

  const logUserTextRender = (text: string) => {
    try {
      const flattenedStyle = StyleSheet.flatten(styles.userText);
      console.log('MessageBubble - About to render user text', {
        textPreview: text.slice(0, 100),
        textLength: text.length,
        flattenedStyle,
      });
    } catch (error) {
      console.error('MessageBubble - Failed to log user text render context', error);
    }
  };

  const handleUserTextLayout = (event: any) => {
    try {
      console.log('MessageBubble - user text layout', event.nativeEvent?.layout);
    } catch (error) {
      console.error('MessageBubble - Failed to log user text layout', error);
    }
  };

  // User avatar (matching desktop: backgroundColor: 'rgb(193, 193, 182)', color: 'rgb(15, 16, 13)')
  const renderUserAvatar = () => (
    <View style={styles.userAvatar}>
      <Text style={styles.userAvatarText}>
        {user?.name ? getInitials(user.name) : 'U'}
      </Text>
    </View>
  );
  // Check if text contains Markdown patterns
  const hasMarkdown = (text: string) => {
    return /[*_`#\[\]()>|~-]/.test(text) ||
           /^[•\-\*]\s/m.test(text) ||
           /^\d+\.\s/m.test(text) ||
           /^#{1,6}\s/.test(text);
  };

  const renderText = (text: string, isUserMessage: boolean) => {
    if (isUserMessage) {
      logUserTextRender(text);
    }

    if (hasMarkdown(text)) {
      return (
        <Markdown style={isUserMessage ? (isQueued ? markdownUserQueuedStyles : markdownUserStyles) : markdownAssistantStyles}>
          {text}
        </Markdown>
      );
    } else {
      return (
        <Text
          style={isUserMessage ? (isQueued ? styles.userTextQueued : styles.userText) : styles.assistantText}
          onLayout={isUserMessage ? handleUserTextLayout : undefined}
        >
          {text}
        </Text>
      );
    }
  };

  return (
    <View style={styles.messageContainer}>
      {isUser ? (
        // User message aligned to the right with dark background and avatar
        <View>
          <View style={styles.userMessageWrapper}>
            <View style={[
              styles.userBubble,
              isQueued && styles.queuedMessageBubble,
              message.status === 'failed' && styles.failedMessage
            ]}>
              {renderUserAvatar()}
              <View style={styles.userContentWrapper}>
                {message.isAudio && message.audioData && message.audioMimeType ? (
                  <VoiceMessagePlayer
                    audioData={message.audioData}
                    audioMimeType={message.audioMimeType}
                    duration={message.duration || 0}
                    fileName={message.audioFileName}
                  />
                ) : (
                  message.text && message.text.length > 0 ? (
                    renderText(message.text, true)
                  ) : (
                    <Text style={styles.userText}>[Empty message]</Text>
                  )
                )}
                {/* Queued status subscript */}
                {isQueued && (
                  <Text style={styles.queuedSubscript}>(queued)</Text>
                )}
              </View>
            </View>
          </View>
          {/* Copy button for user messages */}
          {message.text && !message.isAudio && (
            <View style={styles.copyButtonContainerRight}>
              <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
                {copied ? (
                  <AnimatedCheckmark size={16} />
                ) : (
                  <CopyIcon size={20} color="#888" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        // Assistant message aligned to the left with transparent background
        <View>
          <View style={styles.assistantMessageWrapper}>
            <View style={styles.assistantBubble}>
              {message.isAudio && message.audioData && message.audioMimeType ? (
                <>
                  <VoiceMessagePlayer
                    audioData={message.audioData}
                    audioMimeType={message.audioMimeType}
                    duration={message.duration || 0}
                    fileName={message.audioFileName}
                  />
                  {/* Show transcription text below audio if present */}
                  {message.text && message.text.length > 0 && (
                    <View style={styles.transcriptionContainer}>
                      {renderText(message.text, false)}
                    </View>
                  )}
                </>
              ) : (
                message.text && message.text.length > 0 ? (
                  renderText(message.text, false)
                ) : (
                  <Text style={styles.assistantText}>[Empty message]</Text>
                )
              )}
            </View>
          </View>
          {/* Copy button for assistant messages - show for text-only or audio with transcription */}
          {message.text && (
            <View style={styles.copyButtonContainerRight}>
              <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
                {copied ? (
                  <AnimatedCheckmark size={16} />
                ) : (
                  <CopyIcon size={20} color="#888" />
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Disclaimer for last assistant message */}
          {isLastAssistantMessage && (
            <View style={styles.disclaimerContainer}>
              <Logo width={16} height={16} style={styles.disclaimerIcon} />
              <Text style={styles.disclaimerText}>
                {assistantName} can make mistakes. Please double check responses.
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    width: '100%',
    marginBottom: 24,
  },
  // User message styles - aligned to the RIGHT
  userMessageWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Align to right
    width: '100%',
  },
  userBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgb(15, 16, 13)', // Exact desktop color
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '90%',
    gap: 12,
    flexShrink: 1,
    alignSelf: 'flex-end',
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgb(193, 193, 182)', // Exact desktop color
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'rgb(15, 16, 13)', // Exact desktop color
    fontFamily: 'Styrene-B',
  },
  userContentWrapper: {
    flexShrink: 1,
    minWidth: 0,
  },
  userText: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.95)', // Exact desktop color
    fontFamily: 'Styrene-B',
    flexShrink: 1,
  },
  userTextQueued: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.5)', // Grayed out for queued
    fontFamily: 'Styrene-B',
    fontStyle: 'italic',
    flexShrink: 1,
  },
  queuedMessageBubble: {
    opacity: 0.7,
  },
  failedMessage: {
    opacity: 0.5,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.5)',
  },
  // Assistant message styles - aligned to the LEFT
  assistantMessageWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // Align to left
    width: '100%',
  },
  assistantBubble: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 8,
    maxWidth: '90%', // Limit width so it doesn't stretch full width
  },
  assistantText: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.95)', // Exact desktop color
    fontFamily: 'Styrene-B',
  },
  transcriptionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  // Copy button styles
  copyButtonContainerRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  copyButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: COLORS.MAIN_BG,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  disclaimerIcon: {
    marginRight: 8,
    opacity: 0.7,
  },
  disclaimerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'Styrene-B',
    flex: 1,
  },
  queuedSubscript: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    fontFamily: 'Styrene-B',
    fontStyle: 'italic',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
});

// Markdown styles for queued user messages
const markdownUserQueuedStyles = {
  body: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Styrene-B',
    fontStyle: 'italic',
  },
  heading1: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'Styrene-B',
    fontStyle: 'italic',
  },
  heading2: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'Styrene-B',
    fontStyle: 'italic',
  },
  heading3: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'Styrene-B',
    fontStyle: 'italic',
  },
  paragraph: {
    marginBottom: 8,
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'Styrene-B',
    fontStyle: 'italic',
  },
  strong: {
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
  },
  em: {
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  code_inline: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 2,
    borderRadius: 3,
    fontFamily: 'monospace',
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
  },
  code_block: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    borderRadius: 5,
    fontFamily: 'monospace',
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
  },
  fence: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    borderRadius: 5,
    fontFamily: 'monospace',
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
  },
  bullet_list: {
    marginBottom: 8,
  },
  ordered_list: {
    marginBottom: 8,
  },
  list_item: {
    marginBottom: 4,
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'Styrene-B',
    fontStyle: 'italic',
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: 'rgba(255, 255, 255, 0.3)',
    paddingLeft: 10,
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  link: {
    color: 'rgba(255, 215, 0, 0.5)',
    textDecorationLine: 'underline',
    fontStyle: 'italic',
  },
};

// Markdown styles for user messages
const markdownUserStyles = {
  body: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Styrene-B',
  },
  heading1: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'rgba(255, 255, 255, 0.95)',
    fontFamily: 'Styrene-B',
  },
  heading2: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    color: 'rgba(255, 255, 255, 0.95)',
    fontFamily: 'Styrene-B',
  },
  heading3: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: 'rgba(255, 255, 255, 0.95)',
    fontFamily: 'Styrene-B',
  },
  paragraph: {
    marginBottom: 8,
    color: 'rgba(255, 255, 255, 0.95)',
    fontFamily: 'Styrene-B',
  },
  strong: {
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  em: {
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  code_inline: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 2,
    borderRadius: 3,
    fontFamily: 'monospace',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  code_block: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    borderRadius: 5,
    fontFamily: 'monospace',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  fence: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    borderRadius: 5,
    fontFamily: 'monospace',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  bullet_list: {
    marginBottom: 8,
  },
  ordered_list: {
    marginBottom: 8,
  },
  list_item: {
    marginBottom: 4,
    color: 'rgba(255, 255, 255, 0.95)',
    fontFamily: 'Styrene-B',
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: 'rgba(255, 255, 255, 0.3)',
    paddingLeft: 10,
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  link: {
    color: '#FFD700',
    textDecorationLine: 'underline',
  },
};

// Markdown styles for assistant messages
const markdownAssistantStyles = {
  body: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Styrene-B',
  },
  heading1: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'rgba(255, 255, 255, 0.95)',
    fontFamily: 'Styrene-B',
  },
  heading2: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    color: 'rgba(255, 255, 255, 0.95)',
    fontFamily: 'Styrene-B',
  },
  heading3: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: 'rgba(255, 255, 255, 0.95)',
    fontFamily: 'Styrene-B',
  },
  paragraph: {
    marginBottom: 8,
    color: 'rgba(255, 255, 255, 0.95)',
    fontFamily: 'Styrene-B',
  },
  strong: {
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  em: {
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  code_inline: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 2,
    borderRadius: 3,
    fontFamily: 'monospace',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  code_block: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    borderRadius: 5,
    fontFamily: 'monospace',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  fence: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    borderRadius: 5,
    fontFamily: 'monospace',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  bullet_list: {
    marginBottom: 8,
  },
  ordered_list: {
    marginBottom: 8,
  },
  list_item: {
    marginBottom: 4,
    color: 'rgba(255, 255, 255, 0.95)',
    fontFamily: 'Styrene-B',
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: 'rgba(255, 255, 255, 0.3)',
    paddingLeft: 10,
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  link: {
    color: '#FFD700',
    textDecorationLine: 'underline',
  },
};












