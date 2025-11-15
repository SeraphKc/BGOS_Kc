import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ScrollView, Text, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '@bgos/shared-logic';
import { FileInfo } from '@bgos/shared-types';
import { launchImageLibrary } from 'react-native-image-picker';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { AddIcon } from '../icons/AddIcon';
import { MicrophoneIcon } from '../icons/MicrophoneIcon';
import { VoiceSquareIcon } from '../icons/VoiceSquareIcon';
import { SendIcon } from '../icons/SendIcon';
import { useVoiceRecording, VoiceRecordingData } from '../../hooks/useVoiceRecording';
import { VoiceRecordingInterface } from './VoiceRecordingInterface';

interface MessageInputProps {
  onSend: (text: string, files?: FileInfo[], voiceData?: VoiceRecordingData) => void;
  disabled?: boolean;
  placeholder?: string;
  chatId?: string;
}

const MIN_INPUT_HEIGHT = 40;
const MAX_INPUT_HEIGHT = 120;

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
  chatId,
}) => {
  const navigation = useNavigation();
  const [text, setText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<FileInfo[]>([]);
  const [inputHeight, setInputHeight] = useState(MIN_INPUT_HEIGHT);
  const inputRef = useRef<TextInput>(null);

  // Refs for synchronous state tracking (prevents double-send bug)
  const isSendingRef = useRef(false);
  const textRef = useRef('');

  // Keep textRef in sync with state
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  // Voice recording hook
  const {
    isRecording,
    recordingDuration,
    audioLevel,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceRecording();

  const handleTextChange = useCallback((newText: string) => {
    // Detect if a newline was added at the end (Enter key pressed)
    if (newText.endsWith('\n') && newText.length > textRef.current.length) {
      // User pressed Enter - only process if not disabled
      if (!disabled) {
        const messageText = textRef.current.trim();
        if (messageText || attachedFiles.length > 0) {
          handleSend();
        }
      }
      return;
    }

    // Normal text change - update both state and ref
    setText(newText);
    textRef.current = newText;
  }, [attachedFiles, disabled, handleSend]);

  const handleSend = useCallback(() => {
    // Double-send protection: Early return if already sending
    if (isSendingRef.current) {
      console.log('⚠️ MessageInput - Prevented duplicate send');
      return;
    }

    const messageText = textRef.current.trim();
    const hasContent = messageText || attachedFiles.length > 0;

    console.log('🔵 MessageInput.handleSend - START', {
      originalText: textRef.current,
      trimmedText: messageText,
      textLength: messageText.length,
      hasAttachments: attachedFiles.length > 0,
      hasContent,
      disabled,
      isSending: isSendingRef.current,
    });

    if (!hasContent || disabled) {
      console.log('🔴 MessageInput.handleSend - Not sending (no content or disabled)');
      return;
    }

    // Set flag immediately (synchronous!)
    isSendingRef.current = true;

    try {
      const textToSend = messageText || '[File(s) attached]';
      console.log('🟢 MessageInput.handleSend - Calling onSend with:', {
        text: textToSend,
        textLength: textToSend.length,
        filesCount: attachedFiles.length,
      });

      onSend(textToSend, attachedFiles);
      setText('');
      textRef.current = '';
      setAttachedFiles([]);

      console.log('✅ MessageInput.handleSend - Complete, input cleared');
    } finally {
      // Reset flag after delay to prevent rapid double-taps
      setTimeout(() => {
        isSendingRef.current = false;
      }, 300);
    }
  }, [onSend, attachedFiles, disabled]);

  const handleAttach = async () => {
    try {
      // Check if already at limit
      if (attachedFiles.length >= 3) {
        Alert.alert('File Limit', 'You can only attach up to 3 files');
        return;
      }

      // Pick files using image picker (supports images and some documents)
      const result = await launchImageLibrary({
        mediaType: 'mixed', // Allow both photos and videos
        selectionLimit: 3 - attachedFiles.length, // Remaining slots
        includeBase64: false, // We'll read it manually for better control
      });

      if (result.didCancel) {
        console.log('User cancelled file picker');
        return;
      }

      if (result.errorCode) {
        Alert.alert('Error', result.errorMessage || 'Failed to pick files');
        return;
      }

      if (!result.assets) {
        return;
      }

      // Process each selected file
      const newFiles: FileInfo[] = [];
      for (const asset of result.assets) {
        try {
          // Get file URI
          const uri = asset.uri;
          if (!uri) continue;

          // Read file as base64
          const base64 = await ReactNativeBlobUtil.fs.readFile(uri, 'base64');

          // Determine file type
          const mimeType = asset.type || 'application/octet-stream';
          const fileName = asset.fileName || `file_${Date.now()}`;

          const fileInfo: FileInfo = {
            fileName,
            fileData: base64,
            fileMimeType: mimeType,
            isImage: mimeType.startsWith('image/'),
            isVideo: mimeType.startsWith('video/'),
            isAudio: mimeType.startsWith('audio/'),
            isDocument: !mimeType.startsWith('image/') &&
                       !mimeType.startsWith('video/') &&
                       !mimeType.startsWith('audio/'),
          };

          newFiles.push(fileInfo);
        } catch (error) {
          console.error('Error processing file:', asset.fileName, error);
          Alert.alert('Error', `Failed to process file: ${asset.fileName}`);
        }
      }

      setAttachedFiles([...attachedFiles, ...newFiles]);
    } catch (err) {
      console.error('Error picking files:', err);
      Alert.alert('Error', 'Failed to pick files');
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
  };

  const handleMicrophone = async () => {
    if (disabled) return;

    if (isRecording) {
      // If already recording, stop and don't send (this shouldn't happen in normal flow)
      await cancelRecording();
    } else {
      // Start recording
      await startRecording();
    }
  };

  const handleRecordingConfirm = async () => {
    const voiceData = await stopRecording();
    if (voiceData) {
      // Send voice message with transcription placeholder
      onSend('[Voice message]', [], voiceData);
    }
  };

  const handleRecordingCancel = async () => {
    await cancelRecording();
  };

  const handleVoiceAgent = () => {
    if (disabled) return;

    console.log('MessageInput - Opening voice agent via navigation');
    navigation.navigate('VoiceAgent' as never);
  };

  const computedInputHeight = Math.min(MAX_INPUT_HEIGHT, Math.max(MIN_INPUT_HEIGHT, inputHeight));
  const hasText = text.trim().length > 0;
  const hasAttachments = attachedFiles.length > 0;

  const getFileIcon = (file: FileInfo): string => {
    if (file.isImage) return '🖼️';
    if (file.isVideo) return '🎬';
    if (file.isAudio) return '🎵';
    return '📄';
  };

  return (
    <View style={styles.container}>
      {/* Voice recording interface overlay */}
      {isRecording && (
        <VoiceRecordingInterface
          duration={recordingDuration}
          audioLevel={audioLevel}
          onCancel={handleRecordingCancel}
          onConfirm={handleRecordingConfirm}
        />
      )}

      {/* Attached files preview */}
      {hasAttachments && (
        <View style={styles.attachmentsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {attachedFiles.map((file, index) => (
              <View key={index} style={styles.fileBadge}>
                <Text style={styles.fileIcon}>{getFileIcon(file)}</Text>
                <Text style={styles.fileName} numberOfLines={1}>
                  {file.fileName}
                </Text>
                <TouchableOpacity
                  style={styles.removeFileButton}
                  onPress={() => handleRemoveFile(index)}
                >
                  <Text style={styles.removeFileText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          <Text style={styles.fileCounter}>
            {attachedFiles.length}/3 file{attachedFiles.length !== 1 ? 's' : ''} attached
          </Text>
        </View>
      )}

      {/* Input wrapper containing all elements - Two-line layout */}
      <View style={styles.inputWrapper}>
        {/* Line 1: Text input (full width) */}
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={handleTextChange}
            placeholder={placeholder}
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            style={[styles.input, { height: computedInputHeight }]}
            multiline
            onContentSizeChange={(event) => setInputHeight(event.nativeEvent.contentSize.height)}
            textAlignVertical="top"
            maxLength={2000}
            editable={!disabled}
            blurOnSubmit={false}
            returnKeyType="send"
          />
          {/* Send button only shows when there's text or attachments */}
          {(hasText || hasAttachments) && (
            <TouchableOpacity
              style={[styles.actionButton, styles.sendButton]}
              onPress={handleSend}
              disabled={disabled}
              activeOpacity={0.7}
            >
              <SendIcon size={18} color="#262624" />
            </TouchableOpacity>
          )}
        </View>

        {/* Line 2: Action buttons */}
        <View style={styles.buttonRow}>
          {/* Left: Attach button */}
          <TouchableOpacity
            style={[styles.actionButton, attachedFiles.length >= 3 && styles.disabledButton]}
            onPress={handleAttach}
            disabled={disabled || attachedFiles.length >= 3}
            activeOpacity={0.7}
          >
            <AddIcon size={18} color={attachedFiles.length >= 3 ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.8)"} />
          </TouchableOpacity>

          {/* Spacer to push right buttons to the right */}
          <View style={{ flex: 1 }} />

          {/* Right: Microphone and Voice agent buttons */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleMicrophone}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <MicrophoneIcon size={18} color="#FFD900" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleVoiceAgent}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <VoiceSquareIcon size={20} color="#FFD900" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: COLORS.MAIN_BG,
  },
  attachmentsContainer: {
    marginBottom: 8,
    paddingBottom: 8,
  },
  fileBadge: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: COLORS.INPUT_BG,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    maxWidth: 200,
  },
  fileIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  fileName: {
    color: COLORS.WHITE_1,
    fontSize: 13,
    fontFamily: 'Styrene-B',
    flex: 1,
  },
  removeFileButton: {
    marginLeft: 8,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 8,
  },
  removeFileText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 20,
    fontWeight: 'bold',
  },
  fileCounter: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontFamily: 'Styrene-B',
    marginTop: 4,
  },
  inputWrapper: {
    backgroundColor: COLORS.INPUT_BG,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'transparent',
    color: COLORS.WHITE_1,
    fontSize: 15,
    fontFamily: 'Styrene-B',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    justifyContent: 'flex-start',
    gap: 8,
    paddingLeft: 4,
  },
  actionButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  disabledButton: {
    opacity: 0.5,
  },
  sendButton: {
    backgroundColor: '#FFD700',
    marginLeft: 8,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
});






