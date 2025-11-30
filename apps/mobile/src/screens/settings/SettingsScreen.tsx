import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '@clerk/clerk-expo';
import { RootState, updateUser } from '@bgos/shared-state';
import { COLORS, getInitials, getAvatarColor } from '@bgos/shared-logic';
import { ChevronDownIcon } from '../../components/icons/ChevronDownIcon';
import Toast from 'react-native-toast-message';

const workRoleOptions = [
  'Select your work function',
  'Marketing',
  'Product Management',
  'Engineering',
  'Human Resources',
  'Finance',
  'Sales',
  'Operations',
  'Data Science',
  'Design',
  'Legal',
  'Other',
];

export default function SettingsScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const { signOut } = useAuth();
  const currentUser = useSelector((state: RootState) => state.user.currentUser);

  // Original values for cancel functionality
  const [originalName] = useState(currentUser?.name || '');
  const [originalRole] = useState(currentUser?.role || '');

  // Current editing values
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [workRole, setWorkRole] = useState(currentUser?.role || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Handle sign out
  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setSigningOut(true);
              await signOut();
              Toast.show({
                type: 'success',
                text1: 'Signed Out',
                text2: 'You have been signed out successfully',
              });
              // Navigation will be handled automatically by AppNavigator
            } catch (error: any) {
              console.error('Sign out error:', error);
              Toast.show({
                type: 'error',
                text1: 'Sign Out Failed',
                text2: error.message || 'Could not sign out',
              });
            } finally {
              setSigningOut(false);
            }
          },
        },
      ],
    );
  };

  const handleSelectRole = (role: string) => {
    if (role !== 'Select your work function') {
      setWorkRole(role);
    }
    setShowDropdown(false);
  };

  const handleSave = () => {
    if (fullName.trim()) {
      dispatch(updateUser({ name: fullName.trim(), role: workRole }));
      navigation.goBack();
    }
  };

  const handleCancel = () => {
    setFullName(originalName);
    setWorkRole(originalRole);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <Text style={styles.closeIcon}>×</Text>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.label}>Full name</Text>
          <View style={styles.profileRow}>
            {/* Avatar Preview */}
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: fullName.trim()
                    ? getAvatarColor(fullName)
                    : '#2A2A2A',
                },
              ]}
            >
              <Text style={styles.avatarText}>
                {fullName.trim() ? getInitials(fullName) : '?'}
              </Text>
            </View>

            {/* Name Input */}
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              placeholderTextColor="#6b6b68"
              style={styles.input}
            />
          </View>
        </View>

        {/* Work Role Section */}
        <View style={styles.section}>
          <Text style={styles.label}>What best describes your work?</Text>
          <TouchableOpacity
            style={[
              styles.dropdownTrigger,
              showDropdown && styles.dropdownTriggerFocused,
            ]}
            onPress={() => setShowDropdown(!showDropdown)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.dropdownText,
                !workRole && styles.dropdownPlaceholder,
              ]}
            >
              {workRole || 'Select your work function'}
            </Text>
            <ChevronDownIcon size={16} color="#9a9a98" />
          </TouchableOpacity>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.label}>Appearance</Text>

          <View style={styles.appearanceOptions}>
            {/* Dark Theme (Active) */}
            <View style={[styles.appearanceOption, styles.appearanceOptionActive]}>
              <Text style={styles.appearanceText}>Dark</Text>
              <View style={styles.radioButtonActive} />
            </View>

            {/* Light Theme (Coming Soon) */}
            <View style={[styles.appearanceOption, styles.appearanceOptionDisabled]}>
              <Text style={[styles.appearanceText, styles.appearanceTextDisabled]}>
                Light
              </Text>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.label}>Account</Text>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            activeOpacity={0.7}
            disabled={signingOut}
          >
            <Text style={styles.signOutButtonText}>
              {signingOut ? 'Signing Out...' : 'Sign Out'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Dropdown Modal */}
      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}
        >
          <View style={styles.dropdownModal}>
            <ScrollView
              style={styles.dropdownList}
              showsVerticalScrollIndicator={false}
            >
              {workRoleOptions.map((option, index) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.dropdownOption,
                    option === workRole && styles.dropdownOptionSelected,
                    index < workRoleOptions.length - 1 && styles.dropdownOptionBorder,
                  ]}
                  onPress={() => handleSelectRole(option)}
                  activeOpacity={0.7}
                  disabled={index === 0}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      index === 0 && styles.dropdownOptionTextDisabled,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Footer with Save and Cancel buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.7}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#212121',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  closeIcon: {
    fontSize: 32,
    color: '#a7a7a5',
    fontWeight: '300',
  },
  titleContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Styrene-B',
    color: '#e8e8e6',
    fontWeight: '400',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  label: {
    color: '#9a9a98',
    fontSize: 14,
    fontFamily: 'Styrene-B',
    marginBottom: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Styrene-B',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2a2a28',
    borderWidth: 1,
    borderColor: '#3c3c3a',
    borderRadius: 8,
    color: '#e8e8e6',
    fontSize: 14,
    fontFamily: 'Styrene-B',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2a2a28',
    borderWidth: 1,
    borderColor: '#3c3c3a',
    borderRadius: 8,
  },
  dropdownTriggerFocused: {
    borderColor: '#FFD700',
  },
  dropdownText: {
    color: '#e8e8e6',
    fontSize: 14,
    fontFamily: 'Styrene-B',
    flex: 1,
  },
  dropdownPlaceholder: {
    color: '#6b6b68',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownModal: {
    backgroundColor: '#2a2a28',
    borderWidth: 1,
    borderColor: '#3c3c3a',
    borderRadius: 8,
    width: '100%',
    maxWidth: 400,
    maxHeight: 400,
    overflow: 'hidden',
  },
  dropdownList: {
    maxHeight: 400,
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownOptionSelected: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  dropdownOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#3c3c3a',
  },
  dropdownOptionText: {
    color: '#e8e8e6',
    fontSize: 14,
    fontFamily: 'Styrene-B',
  },
  dropdownOptionTextDisabled: {
    color: '#6b6b68',
  },
  appearanceOptions: {
    gap: 12,
  },
  appearanceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2a2a28',
    borderWidth: 1,
    borderColor: '#3c3c3a',
    borderRadius: 8,
  },
  appearanceOptionActive: {
    borderColor: '#FFD700',
    borderWidth: 2,
  },
  appearanceOptionDisabled: {
    backgroundColor: '#1a1a18',
    opacity: 0.5,
  },
  appearanceText: {
    color: '#e8e8e6',
    fontSize: 14,
    fontFamily: 'Styrene-B',
  },
  appearanceTextDisabled: {
    color: '#6b6b68',
  },
  radioButtonActive: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFD700',
  },
  comingSoonBadge: {
    backgroundColor: '#3c3c3a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  comingSoonText: {
    fontSize: 11,
    fontFamily: 'Styrene-B',
    color: '#9a9a98',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#3c3c3a',
    backgroundColor: '#212121',
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3c3c3a',
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#e8e8e6',
    fontSize: 14,
    fontFamily: 'Styrene-B',
  },
  saveButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: '#FFD700',
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 14,
    fontFamily: 'Styrene-B',
    fontWeight: '600',
  },
  signOutButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#DC3545',
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Styrene-B',
    fontWeight: '700',
  },
});
