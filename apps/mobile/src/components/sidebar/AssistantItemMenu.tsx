import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { StarIcon } from '../icons/StarIcon';
import { StarFilledIcon } from '../icons/StarFilledIcon';
import { ThreeDotsIcon } from '../icons/ThreeDotsIcon';
import { EditIcon } from '../icons/EditIcon';
import { TrashIcon } from '../icons/TrashIcon';

interface Assistant {
  id: string;
  name: string;
  isStarred?: boolean;
}

interface AssistantItemMenuProps {
  assistant: Assistant;
  isSelected: boolean;
  isVisible: boolean;
  onNewChat: (assistantId: string) => void;
  onStar: (assistantId: string) => void;
  onEdit: (assistantId: string) => void;
  onDelete: (assistantId: string) => void;
  onMenuToggle: () => void;
}

export const AssistantItemMenu: React.FC<AssistantItemMenuProps> = ({
  assistant,
  isSelected,
  isVisible,
  onNewChat,
  onStar,
  onEdit,
  onDelete,
  onMenuToggle,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleMenuPress = () => {
    console.log('Menu button pressed for assistant:', assistant.id);
    setShowMenu(true);
  };

  const handleCloseMenu = () => {
    setShowMenu(false);
  };

  const handleNewChat = () => {
    handleCloseMenu();
    onNewChat(assistant.id);
  };

  const handleStar = () => {
    handleCloseMenu();
    onStar(assistant.id);
  };

  const handleEdit = () => {
    handleCloseMenu();
    onEdit(assistant.id);
  };

  const handleDelete = () => {
    handleCloseMenu();
    onDelete(assistant.id);
  };

  return (
    <>
      {/* Three Dots Button */}
      <TouchableOpacity
        style={[styles.menuButton, (!isSelected && !isVisible) && styles.menuButtonHidden]}
        onPress={handleMenuPress}
        activeOpacity={0.7}
      >
        <ThreeDotsIcon size={16} color="rgb(166, 165, 157)" />
      </TouchableOpacity>

      {/* Bottom Sheet Menu */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseMenu}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleCloseMenu}
        >
          <View
            style={styles.bottomSheet}
            onStartShouldSetResponder={() => true}
          >
            {/* New Chat Option */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleNewChat}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemIcon}>
                <Text style={styles.menuItemIconText}>+</Text>
              </View>
              <Text style={styles.menuItemText}>New Chat</Text>
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* Star/Unstar Option */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleStar}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemIcon}>
                {assistant.isStarred ? (
                  <StarFilledIcon size={14} color="#FFD700" />
                ) : (
                  <StarIcon size={14} color="rgb(166, 165, 157)" />
                )}
              </View>
              <Text style={styles.menuItemText}>
                {assistant.isStarred ? 'Unstar' : 'Star'}
              </Text>
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* Edit Option */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleEdit}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemIcon}>
                <EditIcon size={14} color="rgb(166, 165, 157)" />
              </View>
              <Text style={styles.menuItemText}>Edit</Text>
            </TouchableOpacity>

            {/* Delete Option */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemIcon}>
                <TrashIcon size={14} color="#d66171" />
              </View>
              <Text style={[styles.menuItemText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  menuButton: {
    padding: 4,
    borderRadius: 4,
    opacity: 1,
  },
  menuButtonHidden: {
    opacity: 0,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: 'rgb(48, 48, 46)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 8,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: '#3c3c3a',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemIconText: {
    fontSize: 16,
    color: 'rgb(166, 165, 157)',
  },
  menuItemText: {
    fontSize: 14,
    fontFamily: 'Styrene-B',
    color: '#e8e8e6',
  },
  deleteText: {
    color: '#d66171',
  },
  separator: {
    height: 1,
    backgroundColor: '#3c3c3a',
    marginHorizontal: 16,
  },
});
