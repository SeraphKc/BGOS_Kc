import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import ImageCropPicker from 'react-native-image-crop-picker';
import ColorPicker, { Panel1, HueSlider, OpacitySlider, Swatches, Preview, returnedResults } from 'reanimated-color-picker';
import { COLORS, getInitials, avatarColors } from '@bgos/shared-logic';

interface Assistant {
  id: string;
  name: string;
  subtitle?: string;
  avatarUrl?: string;
  webhookUrl?: string;
  s2sToken?: string;
  code?: string;
}

interface EditAssistantModalProps {
  isOpen: boolean;
  assistant: Assistant;
  onClose: () => void;
  onSave: (updatedAssistant: Partial<Assistant>) => Promise<void>;
}

export const EditAssistantModal: React.FC<EditAssistantModalProps> = ({
  isOpen,
  assistant,
  onClose,
  onSave,
}) => {
  // Form state
  const [name, setName] = useState(assistant.name || '');
  const [token, setToken] = useState('');
  const [speechToken, setSpeechToken] = useState(assistant.s2sToken || '');
  const [webhook, setWebhook] = useState(assistant.webhookUrl || '');
  const [description, setDescription] = useState(assistant.subtitle || '');
  const [code, setCode] = useState(assistant.code || '');

  // Avatar state
  const [avatarImage, setAvatarImage] = useState<string | null>(() => {
    const url = assistant.avatarUrl;
    if (
      url &&
      typeof url === 'string' &&
      url.trim() !== '' &&
      !avatarColors.includes(url) &&
      (url.startsWith('data:image/') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('file://'))
    ) {
      return url;
    }
    return null;
  });
  const [avatarColor, setAvatarColor] = useState<string>(() => {
    if (assistant.avatarUrl && avatarColors.includes(assistant.avatarUrl)) {
      return assistant.avatarUrl;
    }
    return avatarColors[0];
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Reset form when assistant changes
  useEffect(() => {
    if (isOpen) {
      setName(assistant.name || '');
      setSpeechToken(assistant.s2sToken || '');
      setWebhook(assistant.webhookUrl || '');
      setDescription(assistant.subtitle || '');
      setCode(assistant.code || '');
      setToken('');

      const url = assistant.avatarUrl;
      if (
        url &&
        typeof url === 'string' &&
        url.trim() !== '' &&
        !avatarColors.includes(url) &&
        (url.startsWith('data:image/') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('file://'))
      ) {
        setAvatarImage(url);
      } else {
        setAvatarImage(null);
      }

      if (assistant.avatarUrl && avatarColors.includes(assistant.avatarUrl)) {
        setAvatarColor(assistant.avatarUrl);
      } else {
        setAvatarColor(avatarColors[0]);
      }
    }
  }, [isOpen, assistant]);

  const isFormValid = name.trim() !== '' && webhook.trim() !== '' && code.trim() !== '';

  const handleImagePicker = async () => {
    try {
      setUploadingImage(true);
      const image = await ImageCropPicker.openPicker({
        width: 400,
        height: 400,
        cropping: true,
        cropperCircleOverlay: true,
        includeBase64: true,
        compressImageQuality: 0.8,
        mediaType: 'photo',
      });

      if (image.data) {
        const base64Image = `data:${image.mime};base64,${image.data}`;
        setAvatarImage(base64Image);
      }
    } catch (error: any) {
      if (error.code !== 'E_PICKER_CANCELLED') {
        console.error('Image picker error:', error);
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCamera = async () => {
    try {
      setUploadingImage(true);
      const image = await ImageCropPicker.openCamera({
        width: 400,
        height: 400,
        cropping: true,
        cropperCircleOverlay: true,
        includeBase64: true,
        compressImageQuality: 0.8,
        mediaType: 'photo',
      });

      if (image.data) {
        const base64Image = `data:${image.mime};base64,${image.data}`;
        setAvatarImage(base64Image);
      }
    } catch (error: any) {
      if (error.code !== 'E_PICKER_CANCELLED') {
        console.error('Camera error:', error);
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setAvatarImage(null);
  };

  const handleColorSelect = (color: returnedResults) => {
    setAvatarColor(color.hex);
    setShowColorPicker(false);
  };

  const handleSave = async () => {
    if (!isFormValid) return;

    setLoading(true);
    try {
      const updatedAssistant = {
        name: name.trim(),
        subtitle: description.trim(),
        avatarUrl: avatarImage || avatarColor,
        webhookUrl: webhook.trim(),
        s2sToken: speechToken.trim(),
        code: code.trim(),
      };

      await onSave(updatedAssistant);
      onClose();
    } catch (error) {
      console.error('Failed to save assistant:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Edit Assistant</Text>
              <Text style={styles.subtitle}>Customize your Assistant</Text>
            </View>

            {/* Scrollable Content */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
            >
              {/* Avatar Section */}
              <View style={styles.avatarSection}>
                <TouchableOpacity
                  style={[
                    styles.avatarContainer,
                    {
                      backgroundColor: avatarImage ? 'transparent' : avatarColor,
                    },
                  ]}
                  onPress={handleImagePicker}
                  disabled={uploadingImage}
                >
                  {avatarImage ? (
                    <Image source={{ uri: avatarImage }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>{getInitials(name || 'A')}</Text>
                  )}
                  {uploadingImage && (
                    <View style={styles.uploadingOverlay}>
                      <ActivityIndicator color="#FFD700" />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Image Controls */}
                <View style={styles.avatarControls}>
                  <TouchableOpacity
                    style={styles.avatarButton}
                    onPress={handleImagePicker}
                    disabled={uploadingImage}
                  >
                    <Text style={styles.avatarButtonText}>Upload</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.avatarButton}
                    onPress={handleCamera}
                    disabled={uploadingImage}
                  >
                    <Text style={styles.avatarButtonText}>Camera</Text>
                  </TouchableOpacity>
                  {avatarImage && (
                    <TouchableOpacity
                      style={[styles.avatarButton, styles.removeButton]}
                      onPress={handleRemoveImage}
                    >
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Color Picker Toggle */}
                {!avatarImage && (
                  <View style={styles.colorPickerSection}>
                    <Text style={styles.colorPickerLabel}>Select avatar color:</Text>
                    <View style={styles.colorSwatches}>
                      {avatarColors.map((color) => (
                        <TouchableOpacity
                          key={color}
                          style={[
                            styles.colorSwatch,
                            {
                              backgroundColor: color,
                              borderColor: avatarColor === color ? '#FFD700' : 'rgba(255,255,255,0.2)',
                              borderWidth: avatarColor === color ? 3 : 2,
                            },
                          ]}
                          onPress={() => setAvatarColor(color)}
                        />
                      ))}
                    </View>
                  </View>
                )}
              </View>

              {/* Form Fields */}
              <View style={styles.formSection}>
                <TextInput
                  style={styles.input}
                  placeholder="How do you want to call your assistant?"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={name}
                  onChangeText={setName}
                  editable={!loading}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Bearer Token (optional)"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={token}
                  onChangeText={setToken}
                  editable={!loading}
                  secureTextEntry
                />

                <TextInput
                  style={styles.input}
                  placeholder="Speech-to-speech Token"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={speechToken}
                  onChangeText={setSpeechToken}
                  editable={!loading}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Webhook URL *"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={webhook}
                  onChangeText={setWebhook}
                  editable={!loading}
                  autoCapitalize="none"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Description"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={description}
                  onChangeText={setDescription}
                  editable={!loading}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Code *"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={code}
                  onChangeText={setCode}
                  editable={!loading}
                />
              </View>
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!isFormValid || loading) && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={!isFormValid || loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator color="#212121" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#232323',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 24,
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Styrene-B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Styrene-B',
  },
  scrollView: {
    maxHeight: 500,
  },
  avatarSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Styrene-B',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarControls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  avatarButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  avatarButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Styrene-B',
  },
  removeButton: {
    borderColor: 'rgba(255,100,100,0.3)',
    backgroundColor: 'rgba(255,100,100,0.1)',
  },
  removeButtonText: {
    color: '#ff6b6b',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Styrene-B',
  },
  colorPickerSection: {
    width: '100%',
    alignItems: 'center',
  },
  colorPickerLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    marginBottom: 12,
    fontFamily: 'Styrene-B',
  },
  colorSwatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    maxWidth: 280,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  formSection: {
    paddingHorizontal: 24,
    gap: 12,
  },
  input: {
    backgroundColor: '#2A2A28',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Styrene-B',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Styrene-B',
  },
  saveButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#FFD700',
  },
  saveButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#212121',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Styrene-B',
  },
});
