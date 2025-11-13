import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';

interface DeleteAssistantDialogProps {
  isOpen: boolean;
  assistantName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteAssistantDialog: React.FC<DeleteAssistantDialogProps> = ({
  isOpen,
  assistantName,
  onClose,
  onConfirm,
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={styles.dialog}
          onStartShouldSetResponder={() => true}
        >
          <Text style={styles.title}>Delete Assistant?</Text>

          <Text style={styles.message}>
            Are you sure you want to delete "{assistantName}"? All chats with this assistant will also be deleted. This action cannot be undone.
          </Text>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleConfirm}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
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
  dialog: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#212121',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3c3c3a',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Styrene-B',
    color: '#e8e8e6',
    fontWeight: '600',
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Styrene-B',
    color: '#9a9a98',
    lineHeight: 20,
    marginBottom: 20,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3c3c3a',
  },
  cancelButtonText: {
    color: '#e8e8e6',
    fontSize: 14,
    fontFamily: 'Styrene-B',
  },
  deleteButton: {
    backgroundColor: '#d66171',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Styrene-B',
    fontWeight: '600',
  },
});
