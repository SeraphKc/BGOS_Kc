import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AssistantActions, ChatActions } from '@bgos/shared-state';
import { COLORS, getInitials, getAvatarColor, avatarColors } from '@bgos/shared-logic';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { SettingsIcon } from '../icons/SettingsIcon';
import { MessagesSquareIcon } from '../icons/MessagesSquareIcon';
import { ChatHistoryModal } from '../modals/ChatHistoryModal';
import { AssistantItemMenu } from './AssistantItemMenu';
import { ChatItemMenu } from './ChatItemMenu';
import { RenameDialog } from '../dialogs/RenameDialog';
import { DeleteChatDialog } from '../dialogs/DeleteChatDialog';
import { DeleteAssistantDialog } from '../dialogs/DeleteAssistantDialog';
import { EditAssistantModal } from '../modals/EditAssistantModal';
import Logo from '../../assets/logo.svg';

interface SidebarProps extends DrawerContentComponentProps {}

export const Sidebar: React.FC<SidebarProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const assistants = useSelector((state: RootState) => state.assistants.list);
  const chats = useSelector((state: RootState) => state.chats.list);
  const chatHistory = useSelector((state: RootState) => state.chatHistory.list);
  const selectedAssistantId = useSelector((state: RootState) => state.assistants.selectedAssistantId);
  const selectedChatId = useSelector((state: RootState) => state.chats.selectedChatId);
  const user = useSelector((state: RootState) => state.user.currentUser);

  const [expandedAssistantId, setExpandedAssistantId] = useState<string | null>(selectedAssistantId);
  const [showChatHistoryModal, setShowChatHistoryModal] = useState(false);

  // Dialog states
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteChatDialog, setShowDeleteChatDialog] = useState(false);
  const [showDeleteAssistantDialog, setShowDeleteAssistantDialog] = useState(false);
  const [showEditAssistantModal, setShowEditAssistantModal] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [currentAssistantId, setCurrentAssistantId] = useState<string | null>(null);
  const [editingAssistant, setEditingAssistant] = useState<typeof assistants[0] | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  const handleNewChat = () => {
    // Reset chat state and navigate to new chat
    dispatch(ChatActions.setSelectedChat(null));
    navigation.navigate('Chat', { chatId: 'new' });
    navigation.closeDrawer();
  };

  const handleSelectAssistant = (assistantId: string) => {
    dispatch(AssistantActions.setSelectedAssistant(assistantId));

    // Toggle expansion
    if (expandedAssistantId === assistantId) {
      setExpandedAssistantId(null);
    } else {
      setExpandedAssistantId(assistantId);
    }
  };

  const handleSelectChat = (chatId: string, assistantId: string) => {
    dispatch(ChatActions.setSelectedChat(chatId));
    dispatch(AssistantActions.setSelectedAssistant(assistantId));
    navigation.navigate('Chat', { chatId });
    navigation.closeDrawer();
  };

  // Helper function to get last message timestamp for a chat
  const getLastMessageTime = (chatId: string): number => {
    // Find all messages for this chat
    const chatMessages = chatHistory.filter(msg => msg.chatId === chatId);

    if (chatMessages.length === 0) {
      return 0; // No messages = oldest
    }

    // Find the most recent message by sentDate
    const latestMessage = chatMessages.reduce((latest, current) => {
      const latestTime = new Date(latest.sentDate || 0).getTime();
      const currentTime = new Date(current.sentDate || 0).getTime();
      return currentTime > latestTime ? current : latest;
    });

    return new Date(latestMessage.sentDate || 0).getTime();
  };

  // Get chats for a specific assistant
  const getChatsForAssistant = (assistantId: string) => {
    return chats.filter(chat => chat.assistantId === assistantId);
  };

  // Get 20 most recent chats
  const getRecentChats = () => {
    return chats
      .slice()
      .sort((a, b) => getLastMessageTime(b.id) - getLastMessageTime(a.id))
      .slice(0, 20);
  };

  // Assistant menu handlers
  const handleNewChatWithAssistant = (assistantId: string) => {
    dispatch(AssistantActions.setSelectedAssistant(assistantId));
    dispatch(ChatActions.setSelectedChat(null));
    navigation.navigate('Chat' as never, { chatId: 'new', assistantId } as never);
    navigation.closeDrawer();
  };

  const handleStarAssistant = (assistantId: string) => {
    dispatch(AssistantActions.toggleStarAssistant(assistantId));
  };

  const handleEditAssistant = (assistantId: string) => {
    const assistant = assistants.find(a => a.id === assistantId);
    if (assistant) {
      setEditingAssistant(assistant);
      setShowEditAssistantModal(true);
    }
  };

  const handleSaveAssistant = async (updatedAssistant: Partial<typeof assistants[0]>) => {
    if (editingAssistant) {
      dispatch(AssistantActions.updateAssistant({
        id: editingAssistant.id,
        changes: updatedAssistant,
      }));
    }
    setShowEditAssistantModal(false);
    setEditingAssistant(null);
  };

  const handleDeleteAssistant = (assistantId: string) => {
    setCurrentAssistantId(assistantId);
    setShowDeleteAssistantDialog(true);
  };

  const confirmDeleteAssistant = () => {
    if (currentAssistantId) {
      dispatch(AssistantActions.removeAssistant(currentAssistantId));
    }
    setShowDeleteAssistantDialog(false);
    setCurrentAssistantId(null);
  };

  // Chat menu handlers
  const handleStarChat = (chatId: string) => {
    dispatch(ChatActions.toggleStarChat(chatId));
  };

  const handleRenameChat = (chatId: string) => {
    setCurrentChatId(chatId);
    setShowRenameDialog(true);
  };

  const handleSaveRename = (newTitle: string) => {
    if (currentChatId) {
      dispatch(ChatActions.updateChatTitle({ chatId: currentChatId, title: newTitle }));
    }
    setShowRenameDialog(false);
    setCurrentChatId(null);
  };

  const handleDeleteChat = (chatId: string) => {
    setCurrentChatId(chatId);
    setShowDeleteChatDialog(true);
  };

  const confirmDeleteChat = () => {
    if (currentChatId) {
      dispatch(ChatActions.removeChat(currentChatId));
    }
    setShowDeleteChatDialog(false);
    setCurrentChatId(null);
  };

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Logo
            width={80}
            height={20}
            fill="#FFD700"
            style={styles.logo}
          />
          <Text style={styles.headerTitle}>BGOS</Text>
        </View>

        {/* New Chat Button */}
        <TouchableOpacity
          style={styles.newChatButton}
          onPress={handleNewChat}
          activeOpacity={0.7}
        >
          <Text style={styles.newChatIcon}>+</Text>
          <Text style={styles.newChatText}>New chat</Text>
        </TouchableOpacity>

        {/* Chat History Button */}
        <TouchableOpacity
          style={styles.chatHistoryButton}
          onPress={() => setShowChatHistoryModal(true)}
          activeOpacity={0.7}
        >
          <MessagesSquareIcon size={16} color="rgb(166, 165, 157)" strokeWidth={1.5} />
          <Text style={styles.chatHistoryText}>Chats</Text>
        </TouchableOpacity>

        {/* Agents Section Header */}
        <Text style={styles.sectionTitle}>Agents</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Agents List */}
        <View style={styles.section}>
          {assistants.map((assistant) => {
            const isExpanded = expandedAssistantId === assistant.id;
            const assistantChats = getChatsForAssistant(assistant.id);
            const isSelected = selectedAssistantId === assistant.id;

            // Pre-compute avatar configuration to avoid inline complex expressions
            const isColorAvatar = assistant.avatarUrl && avatarColors.includes(assistant.avatarUrl);
            const isImageAvatar = assistant.avatarUrl && !isColorAvatar;
            const backgroundColor = isColorAvatar ? assistant.avatarUrl : getAvatarColor(assistant.name);

            return (
              <View key={assistant.id}>
                {/* Agent Item */}
                <View
                  style={styles.agentItemContainer}
                  onTouchStart={() => setHoveredItemId(`assistant-${assistant.id}`)}
                  onTouchEnd={() => setHoveredItemId(null)}
                >
                  <TouchableOpacity
                    style={[
                      styles.agentItem,
                      isSelected && styles.agentItemSelected,
                    ]}
                    onPress={() => handleSelectAssistant(assistant.id)}
                    activeOpacity={0.7}
                  >
                    {/* Avatar */}
                    <View
                      style={[
                        styles.avatar,
                        { backgroundColor },
                      ]}
                    >
                      {isImageAvatar ? (
                        <Image
                          source={{ uri: assistant.avatarUrl }}
                          style={styles.avatarImage}
                        />
                      ) : (
                        <Text style={styles.avatarText}>
                          {getInitials(assistant.name)}
                        </Text>
                      )}
                    </View>

                    {/* Agent Info */}
                    <View style={styles.agentInfo}>
                      <Text style={styles.agentName} numberOfLines={1}>
                        {assistant.name}
                      </Text>
                      {assistant.subtitle && (
                        <Text style={styles.agentSubtitle} numberOfLines={1}>
                          {assistant.subtitle}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Three Dots Menu */}
                  <AssistantItemMenu
                    assistant={assistant}
                    isSelected={isSelected}
                    isVisible={hoveredItemId === `assistant-${assistant.id}`}
                    onNewChat={handleNewChatWithAssistant}
                    onStar={handleStarAssistant}
                    onEdit={handleEditAssistant}
                    onDelete={handleDeleteAssistant}
                    onMenuToggle={() => {}}
                  />
                </View>

                {/* Expanded Chats */}
                {isExpanded && assistantChats.length > 0 && (
                  <View style={styles.chatsContainer}>
                    {assistantChats
                      .sort((a, b) => getLastMessageTime(b.id) - getLastMessageTime(a.id))
                      .map((chat) => {
                        const isChatSelected = selectedChatId === chat.id;
                        return (
                          <View
                            key={chat.id}
                            style={styles.chatItemContainer}
                            onTouchStart={() => setHoveredItemId(`chat-${chat.id}`)}
                            onTouchEnd={() => setHoveredItemId(null)}
                          >
                            <TouchableOpacity
                              style={[
                                styles.chatItem,
                                isChatSelected && styles.chatItemSelected,
                              ]}
                              onPress={() => handleSelectChat(chat.id, assistant.id)}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={styles.chatTitle}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                              >
                                {chat.title || 'Untitled'}
                              </Text>
                            </TouchableOpacity>

                            {/* Three Dots Menu */}
                            <ChatItemMenu
                              chat={chat}
                              isSelected={isChatSelected}
                              isVisible={hoveredItemId === `chat-${chat.id}`}
                              onRename={handleRenameChat}
                              onDelete={handleDeleteChat}
                              onStar={handleStarChat}
                            />
                          </View>
                        );
                      })}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Recents Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recents</Text>
          {getRecentChats().length === 0 ? (
            <Text style={styles.emptyText}>No recent chats</Text>
          ) : (
            getRecentChats().map((chat) => {
              const isChatSelected = selectedChatId === chat.id;
              return (
                <View
                  key={chat.id}
                  style={styles.chatItemContainer}
                  onTouchStart={() => setHoveredItemId(`recent-${chat.id}`)}
                  onTouchEnd={() => setHoveredItemId(null)}
                >
                  <TouchableOpacity
                    style={[
                      styles.chatItem,
                      isChatSelected && styles.chatItemSelected,
                    ]}
                    onPress={() => handleSelectChat(chat.id, chat.assistantId)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={styles.chatTitle}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {chat.title || 'Untitled'}
                    </Text>
                  </TouchableOpacity>

                  {/* Three Dots Menu */}
                  <ChatItemMenu
                    chat={chat}
                    isSelected={isChatSelected}
                    isVisible={hoveredItemId === `recent-${chat.id}`}
                    onRename={handleRenameChat}
                    onDelete={handleDeleteChat}
                    onStar={handleStarChat}
                  />
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Fixed Bottom - User Profile */}
      <View style={styles.footer}>
        <View style={styles.separator} />
        <View style={styles.footerContent}>
          <TouchableOpacity style={styles.userProfile} activeOpacity={0.7}>
            <View
              style={[
                styles.userAvatar,
                { backgroundColor: user?.name ? getAvatarColor(user.name) : '#2A2A2A' },
              ]}
            >
              <Text style={styles.userAvatarText}>
                {user?.name ? getInitials(user.name) : (user?.email ? user.email.charAt(0).toUpperCase() : 'U')}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.name || user?.email || 'User'}
              </Text>
              <Text style={styles.userPlan}>Free Plan</Text>
            </View>
          </TouchableOpacity>

          {/* Settings Icon Button */}
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings' as never)}
            activeOpacity={0.7}
          >
            <SettingsIcon size={20} color="rgb(166, 165, 157)" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat History Modal */}
      <ChatHistoryModal
        isOpen={showChatHistoryModal}
        onClose={() => setShowChatHistoryModal(false)}
        onSelectChat={(chatId) => {
          dispatch(ChatActions.setSelectedChat(chatId));
          navigation.navigate('Chat' as never, { chatId } as never);
          navigation.closeDrawer();
        }}
        onDeleteChats={(chatIds) => {
          // TODO: Implement bulk delete
          chatIds.forEach(id => {
            dispatch(ChatActions.removeChat(id));
          });
        }}
      />

      {/* Dialogs */}
      <RenameDialog
        isOpen={showRenameDialog}
        currentTitle={currentChatId ? chats.find(c => c.id === currentChatId)?.title || '' : ''}
        onClose={() => {
          setShowRenameDialog(false);
          setCurrentChatId(null);
        }}
        onSave={handleSaveRename}
      />

      <DeleteChatDialog
        isOpen={showDeleteChatDialog}
        chatTitle={currentChatId ? chats.find(c => c.id === currentChatId)?.title || 'this chat' : 'this chat'}
        onClose={() => {
          setShowDeleteChatDialog(false);
          setCurrentChatId(null);
        }}
        onConfirm={confirmDeleteChat}
      />

      <DeleteAssistantDialog
        isOpen={showDeleteAssistantDialog}
        assistantName={currentAssistantId ? assistants.find(a => a.id === currentAssistantId)?.name || 'this assistant' : 'this assistant'}
        onClose={() => {
          setShowDeleteAssistantDialog(false);
          setCurrentAssistantId(null);
        }}
        onConfirm={confirmDeleteAssistant}
      />

      {/* Edit Assistant Modal */}
      {editingAssistant && (
        <EditAssistantModal
          isOpen={showEditAssistantModal}
          assistant={editingAssistant}
          onClose={() => {
            setShowEditAssistantModal(false);
            setEditingAssistant(null);
          }}
          onSave={handleSaveAssistant}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.SIDEBAR_BG, // rgb(31, 30, 28)
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 0,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
  },
  logo: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    fontFamily: 'Styrene-B',
    fontSize: 24,
    fontWeight: '400',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 24,
  },
  newChatIcon: {
    fontSize: 24,
    color: 'rgb(166, 165, 157)',
    fontWeight: '300',
  },
  newChatText: {
    fontFamily: 'Styrene-B',
    fontSize: 16,
    fontWeight: '400',
    color: 'rgb(166, 165, 157)',
  },
  chatHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  chatHistoryText: {
    fontFamily: 'Styrene-B',
    fontSize: 14,
    fontWeight: '400',
    color: 'rgb(166, 165, 157)',
  },
  sectionTitle: {
    fontFamily: 'Styrene-B',
    fontSize: 14,
    fontWeight: '400',
    color: 'rgb(166, 165, 157)',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 16,
  },
  agentItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  agentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  agentItemSelected: {
    backgroundColor: '#141512',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 24,
    height: 24,
  },
  avatarText: {
    fontFamily: 'Styrene-B',
    fontSize: 11,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontFamily: 'Styrene-B',
    fontSize: 13,
    fontWeight: '700',
    color: 'rgb(166, 165, 157)',
  },
  agentSubtitle: {
    fontFamily: 'Styrene-B',
    fontSize: 11,
    fontWeight: '500',
    color: 'rgb(166, 165, 157)',
  },
  chatsContainer: {
    marginTop: 8,
    marginBottom: 8,
    gap: 4,
  },
  chatItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  chatItem: {
    flex: 1,
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  chatItemSelected: {
    backgroundColor: '#141512',
  },
  chatTitle: {
    fontFamily: 'Styrene-B',
    fontSize: 12,
    fontWeight: '400',
    color: 'rgb(166, 165, 157)',
  },
  emptyText: {
    fontFamily: 'Styrene-B',
    fontSize: 12,
    color: 'rgba(166, 165, 157, 0.5)',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    marginBottom: 12,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 8,
    flex: 1,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontFamily: 'Styrene-B',
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: 'Styrene-B',
    fontSize: 12,
    fontWeight: '600',
    color: 'rgb(166, 165, 157)',
    marginBottom: 2,
  },
  userPlan: {
    fontFamily: 'Styrene-B',
    fontSize: 10,
    fontWeight: '400',
    color: 'rgb(166, 165, 157)',
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
});
