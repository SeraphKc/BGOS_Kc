import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { AssistantActions } from '@bgos/shared-state';
import { COLORS, getInitials, getAvatarColor, avatarColors } from '@bgos/shared-logic';
import type { RootState } from '@bgos/shared-state';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { useNavigation } from '@react-navigation/native';

const AgentSelectorDropdown: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const assistants = useSelector((state: RootState) => state.assistants.list);
  const chats = useSelector((state: RootState) => state.chats.list);
  const chatHistory = useSelector((state: RootState) => state.chatHistory.list);
  const selectedAssistantId = useSelector(
    (state: RootState) => state.assistants.selectedAssistantId
  );
  const loading = useSelector((state: RootState) => state.assistants.loading);

  const selectedAssistant = assistants.find((a) => a.id === selectedAssistantId);

  // Separate pinned and unpinned assistants
  const pinnedAssistants = assistants
    .filter((a) => a.isStarred)
    .sort((a, b) => (a.starOrder || 0) - (b.starOrder || 0));

  const unpinnedAssistants = assistants.filter((a) => !a.isStarred);

  const allAssistants = [...pinnedAssistants, ...unpinnedAssistants];

  // Pre-compute avatar configurations for all assistants to avoid inline complex expressions
  const assistantAvatarConfigs = React.useMemo(() => {
    const configs = new Map();
    allAssistants.forEach(assistant => {
      const isColorAvatar = assistant.avatarUrl && avatarColors.includes(assistant.avatarUrl);
      const isImageAvatar = assistant.avatarUrl && !isColorAvatar;
      const backgroundColor = isColorAvatar ? assistant.avatarUrl : getAvatarColor(assistant.name);
      configs.set(assistant.id, { isImageAvatar, backgroundColor });
    });
    return configs;
  }, [allAssistants]);

  // Helper function to get last message timestamp for a chat
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

  const handleSelectAssistant = (assistantId: string) => {
    dispatch(AssistantActions.setSelectedAssistant(assistantId));
    setModalVisible(false);

    // Find chats for this assistant
    const assistantChats = chats
      .filter(chat => chat.assistantId === assistantId)
      .sort((a, b) => getLastMessageTime(b.id) - getLastMessageTime(a.id));

    // Navigate to the most recent chat or new chat if no chats exist
    if (assistantChats.length > 0) {
      const latestChat = assistantChats[0];
      navigation.navigate('Chat' as never, { chatId: latestChat.id } as never);
    } else {
      // No chats with this assistant, start a new chat
      navigation.navigate('Chat' as never, { chatId: 'new' } as never);
    }
  };

  // Render avatar with initials fallback
  const renderAvatar = (assistant: any, size: number = 40) => {
    // Get pre-computed avatar configuration
    const config = assistantAvatarConfigs.get(assistant.id) || {
      isImageAvatar: false,
      backgroundColor: getAvatarColor(assistant.name)
    };

    if (config.isImageAvatar) {
      return (
        <Image
          source={{ uri: assistant.avatarUrl }}
          style={[
            styles.modalAvatar,
            { width: size, height: size, borderRadius: size / 2 }
          ]}
        />
      );
    }

    // Show initials with colored background (either from avatarUrl color or generated color)
    return (
      <View
        style={[
          styles.modalAvatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: config.backgroundColor,
            justifyContent: 'center',
            alignItems: 'center',
          }
        ]}
      >
        <Text style={[styles.avatarInitials, { fontSize: size * 0.4 }]}>
          {getInitials(assistant.name)}
        </Text>
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.dropdownTrigger}>
        <ActivityIndicator size="small" color={COLORS.PRIMARY_1} />
        <Text style={styles.agentName}>Loading...</Text>
      </View>
    );
  }

  // Empty state
  if (assistants.length === 0) {
    return (
      <View style={styles.dropdownTrigger}>
        <Text style={[styles.agentName, styles.emptyText]}>
          No assistants available
        </Text>
      </View>
    );
  }

  return (
    <>
      {/* Dropdown Trigger - Simplified to match Claude */}
      <TouchableOpacity
        style={styles.dropdownTrigger}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        {selectedAssistant && (
          <>
            <Text style={styles.agentName} numberOfLines={1}>
              {selectedAssistant.name}
            </Text>
          </>
        )}
        <View style={styles.chevronContainer}>
          <ChevronDownIcon size={12} color="rgba(255, 255, 255, 0.6)" />
        </View>
      </TouchableOpacity>

      {/* Modal with Agent List */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Assistant</Text>

            <FlatList
              data={allAssistants}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.agentItem,
                    item.id === selectedAssistantId && styles.agentItemSelected,
                  ]}
                  onPress={() => handleSelectAssistant(item.id)}
                  activeOpacity={0.7}
                >
                  {renderAvatar(item, 40)}
                  <View style={styles.agentInfo}>
                    <Text style={styles.modalAgentName}>{item.name}</Text>
                    {item.subtitle && (
                      <Text style={styles.agentDescription} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    )}
                  </View>
                  {item.isStarred && <Text style={styles.starIcon}>⭐</Text>}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  agentName: {
    fontSize: 18,
    fontWeight: '400',
    color: COLORS.WHITE_1,
    fontFamily: 'Styrene-B',
    marginRight: 8,
    letterSpacing: -0.3,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
  },
  chevronContainer: {
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.WHITE_1,
    marginBottom: 16,
    fontFamily: 'Styrene-B',
  },
  agentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  agentItemSelected: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  modalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Styrene-B',
  },
  agentInfo: {
    flex: 1,
  },
  modalAgentName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.WHITE_1,
    marginBottom: 2,
    fontFamily: 'Styrene-B',
  },
  agentDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'Styrene-B',
  },
  starIcon: {
    fontSize: 16,
    marginLeft: 8,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 4,
  },
});

export default AgentSelectorDropdown;
