import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { StarIcon } from '../icons/StarIcon';
import { StarFilledIcon } from '../icons/StarFilledIcon';
import { ThreeDotsIcon } from '../icons/ThreeDotsIcon';

interface Chat {
  id: string;
  title?: string;
  isStarred?: boolean;
}

interface ChatItemMenuProps {
  chat: Chat;
  isSelected: boolean;
  isVisible: boolean;
  onRename: (chatId: string) => void;
  onDelete: (chatId: string) => void;
  onStar?: (chatId: string) => void;
}

export const ChatItemMenu: React.FC<ChatItemMenuProps> = ({
  chat,
  isSelected,
  isVisible,
  onRename,
  onDelete,
  onStar,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleMenuPress = () => {
    setShowMenu(true);
  };

  const handleCloseMenu = () => {
    setShowMenu(false);
  };

  const handleRename = () => {
    handleCloseMenu();
    onRename(chat.id);
  };

  const handleDelete = () => {
    handleCloseMenu();
    onDelete(chat.id);
  };

  const handleStar = () => {
    handleCloseMenu();
    if (onStar) {
      onStar(chat.id);
    }
  };

  const handleCopyChatId = () => {
    handleCloseMenu();
    Clipboard.setString(chat.id);
    Alert.alert('Success', 'Chat ID copied to clipboard');
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
            {/* Star/Unstar Option */}
            {onStar && (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleStar}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemIcon}>
                    {chat.isStarred ? (
                      <StarFilledIcon size={14} color="#FFD700" />
                    ) : (
                      <StarIcon size={14} color="rgb(166, 165, 157)" />
                    )}
                  </View>
                  <Text style={styles.menuItemText}>
                    {chat.isStarred ? 'Unstar' : 'Star'}
                  </Text>
                </TouchableOpacity>
                <View style={styles.separator} />
              </>
            )}

            {/* Rename Option */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleRename}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemIcon}>
                <Text style={styles.menuItemIconText}>✏</Text>
              </View>
              <Text style={styles.menuItemText}>Rename</Text>
            </TouchableOpacity>

            {/* Copy Chat ID Option */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleCopyChatId}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemIcon}>
                <Text style={styles.menuItemIconText}>📋</Text>
              </View>
              <Text style={styles.menuItemText}>Copy chatId</Text>
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* Delete Option */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemIcon}>
                <Text style={[styles.menuItemIconText, styles.deleteIcon]}>🗑</Text>
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
  deleteIcon: {
    color: '#d66171',
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
