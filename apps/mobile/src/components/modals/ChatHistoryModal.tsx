import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  BackHandler,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, ChatActions } from '@bgos/shared-state';
import { COLORS } from '@bgos/shared-logic';

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChats?: (chatIds: string[]) => void;
}

export const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectChat,
  onDeleteChats,
}) => {
  const dispatch = useDispatch();
  const chats = useSelector((state: RootState) => state.chats.list);
  const chatHistory = useSelector((state: RootState) => state.chatHistory.list);
  const assistants = useSelector((state: RootState) => state.assistants.list);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(new Set());
  const [isShaking, setIsShaking] = useState(false);

  // Get last message time for a chat
  const getLastMessageTime = (chatId: string): number => {
    const chatMessages = chatHistory.filter(msg => msg.chatId === chatId);
    if (chatMessages.length === 0) return 0;

    const latestMessage = chatMessages.reduce((latest, current) => {
      const latestTime = new Date(latest.sentDate || 0).getTime();
      const currentTime = new Date(current.sentDate || 0).getTime();
      return currentTime > latestTime ? current : latest;
    });

    return new Date(latestMessage.sentDate || 0).getTime();
  };

  // Get relative time string
  const getRelativeTime = (timestamp: number): string => {
    if (timestamp === 0) return 'No messages';

    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  };

  // Filtered and sorted chats
  const filteredChats = useMemo(() => {
    let filtered = chats;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(chat =>
        chat.title?.toLowerCase().includes(query)
      );
    }

    // Sort by last message time
    return filtered
      .slice()
      .sort((a, b) => getLastMessageTime(b.id) - getLastMessageTime(a.id));
  }, [chats, searchQuery, chatHistory]);

  // Toggle chat selection
  const toggleChatSelection = (chatId: string) => {
    const newSelected = new Set(selectedChatIds);
    if (newSelected.has(chatId)) {
      newSelected.delete(chatId);
    } else {
      newSelected.add(chatId);
    }
    setSelectedChatIds(newSelected);
  };

  // Handle select all / deselect all
  const handleToggleSelectAll = () => {
    if (selectedChatIds.size === filteredChats.length) {
      setSelectedChatIds(new Set());
    } else {
      setSelectedChatIds(new Set(filteredChats.map(c => c.id)));
    }
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedChatIds.size > 0 && onDeleteChats) {
      onDeleteChats(Array.from(selectedChatIds));
      setSelectedChatIds(new Set());
      setIsSelectMode(false);
    }
  };

  // Handle new chat
  const handleNewChat = () => {
    dispatch(ChatActions.setSelectedChat(null));
    onClose();
  };

  // Handle chat selection
  const handleSelectChat = (chatId: string) => {
    if (isSelectMode) {
      toggleChatSelection(chatId);
    } else {
      onSelectChat(chatId);
      onClose();
    }
  };

  // Handle backdrop click
  const handleBackdropClick = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  // Handle close
  const handleClose = () => {
    setSearchQuery('');
    setIsSelectMode(false);
    setSelectedChatIds(new Set());
    onClose();
  };

  // Get assistant name
  const getAssistantName = (assistantId: string): string => {
    const assistant = assistants.find(a => a.id === assistantId);
    return assistant?.name || 'Unknown';
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleBackdropClick}
      >
        <View
          style={[styles.modalContainer, isShaking && styles.shake]}
          onStartShouldSetResponder={() => true}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.title}>Chat History</Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeIcon}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <TextInput
              style={styles.searchInput}
              placeholder="Search chats..."
              placeholderTextColor="#6b6b68"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {/* Action Buttons */}
            <View style={styles.actionBar}>
              <TouchableOpacity
                style={styles.newChatButton}
                onPress={handleNewChat}
              >
                <Text style={styles.newChatButtonText}>New Chat</Text>
              </TouchableOpacity>

              <View style={styles.actionButtons}>
                {isSelectMode ? (
                  <>
                    <TouchableOpacity
                      style={styles.selectButton}
                      onPress={handleToggleSelectAll}
                    >
                      <Text style={styles.selectButtonText}>
                        {selectedChatIds.size === filteredChats.length
                          ? 'Deselect All'
                          : 'Select All'}
                      </Text>
                    </TouchableOpacity>
                    {selectedChatIds.size > 0 && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={handleBulkDelete}
                      >
                        <Text style={styles.deleteButtonText}>
                          Delete ({selectedChatIds.size})
                        </Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => {
                        setIsSelectMode(false);
                        setSelectedChatIds(new Set());
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => setIsSelectMode(true)}
                  >
                    <Text style={styles.selectButtonText}>Select</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Chat List */}
          <ScrollView
            style={styles.chatList}
            contentContainerStyle={styles.chatListContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredChats.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No chats found' : 'No chat history'}
                </Text>
              </View>
            ) : (
              filteredChats.map((chat) => {
                const isSelected = selectedChatIds.has(chat.id);
                const lastMessageTime = getLastMessageTime(chat.id);

                return (
                  <TouchableOpacity
                    key={chat.id}
                    style={[
                      styles.chatItem,
                      isSelected && styles.chatItemSelected,
                    ]}
                    onPress={() => handleSelectChat(chat.id)}
                    activeOpacity={0.7}
                  >
                    {isSelectMode && (
                      <View style={styles.checkbox}>
                        {isSelected && <View style={styles.checkboxChecked} />}
                      </View>
                    )}
                    <View style={styles.chatInfo}>
                      <Text style={styles.chatTitle} numberOfLines={1}>
                        {chat.title || 'Untitled'}
                      </Text>
                      <Text style={styles.chatSubtitle} numberOfLines={1}>
                        {getAssistantName(chat.assistantId)} • Last message{' '}
                        {getRelativeTime(lastMessageTime)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 900,
    height: '90%',
    backgroundColor: '#212121',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3c3c3a',
    overflow: 'hidden',
  },
  shake: {
    // Shake animation would need to be handled differently in React Native
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3c3c3a',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Styrene-B',
    color: '#e8e8e6',
    fontWeight: '400',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 32,
    color: '#a7a7a5',
    fontWeight: '300',
  },
  searchInput: {
    backgroundColor: '#2a2a28',
    borderWidth: 1,
    borderColor: '#3c3c3a',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#e8e8e6',
    fontSize: 14,
    fontFamily: 'Styrene-B',
    marginBottom: 16,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newChatButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  newChatButtonText: {
    color: '#000000',
    fontSize: 14,
    fontFamily: 'Styrene-B',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  selectButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3c3c3a',
  },
  selectButtonText: {
    color: '#e8e8e6',
    fontSize: 13,
    fontFamily: 'Styrene-B',
  },
  deleteButton: {
    backgroundColor: '#d66171',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Styrene-B',
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3c3c3a',
  },
  cancelButtonText: {
    color: '#e8e8e6',
    fontSize: 13,
    fontFamily: 'Styrene-B',
  },
  chatList: {
    flex: 1,
  },
  chatListContent: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#6b6b68',
    fontSize: 14,
    fontFamily: 'Styrene-B',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a28',
    borderWidth: 1,
    borderColor: '#3c3c3a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  chatItemSelected: {
    backgroundColor: '#3d4f5c',
    borderColor: '#5a9fd4',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#5a9fd4',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#5a9fd4',
  },
  chatInfo: {
    flex: 1,
  },
  chatTitle: {
    color: '#e8e8e6',
    fontSize: 15,
    fontFamily: 'Styrene-B',
    fontWeight: '600',
    marginBottom: 4,
  },
  chatSubtitle: {
    color: '#9a9a98',
    fontSize: 12,
    fontFamily: 'Styrene-B',
  },
});
