import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

interface RenameDialogProps {
  isOpen: boolean;
  currentTitle: string;
  onClose: () => void;
  onSave: (newTitle: string) => void;
}

export const RenameDialog: React.FC<RenameDialogProps> = ({
  isOpen,
  currentTitle,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(currentTitle);

  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle);
    }
  }, [isOpen, currentTitle]);

  const handleSave = () => {
    if (title.trim()) {
      onSave(title.trim());
      onClose();
    }
  };

  const handleCancel = () => {
    setTitle(currentTitle);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleCancel}
        >
          <View
            style={styles.dialog}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.title}>Rename Chat</Text>

            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter chat title"
              placeholderTextColor="#6b6b68"
              autoFocus
              selectTextOnFocus
              onSubmitEditing={handleSave}
              returnKeyType="done"
            />

            <View style={styles.buttons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
    width: '100%',
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
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#2a2a28',
    borderWidth: 1,
    borderColor: '#3c3c3a',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#e8e8e6',
    fontSize: 14,
    fontFamily: 'Styrene-B',
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
  saveButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 14,
    fontFamily: 'Styrene-B',
    fontWeight: '600',
  },
});
