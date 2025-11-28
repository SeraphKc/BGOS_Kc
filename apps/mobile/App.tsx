import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { PermissionsAndroid, Platform } from 'react-native';
import Toast, { BaseToast } from 'react-native-toast-message';
import { ElevenLabsProvider } from '@elevenlabs/react-native';
import { createStore } from '@bgos/shared-state';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/theme/theme';
import { VoiceAgentProvider, useVoiceAgentModal } from './src/contexts/VoiceAgentContext';
import { VoiceAgentModal } from './src/components/voice/VoiceAgentModal';

const store = createStore();

// Global audio initialization state - exported for VoiceAgentModal to check
export const audioInitState = {
  isInitialized: false,
  isInitializing: false,
  error: null as string | null,
};

// Pre-initialize WebRTC/Microphone to prevent first-press crash
// This warms up the audio subsystem before the user taps the voice button
const preInitializeAudio = async () => {
  // Prevent multiple simultaneous initialization attempts
  if (audioInitState.isInitializing || audioInitState.isInitialized) {
    console.log('🎙️ Audio already initialized or initializing, skipping...');
    return;
  }

  audioInitState.isInitializing = true;

  try {
    console.log('🎙️ Pre-initializing audio subsystem...');

    // Request microphone permission on Android
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'This app needs access to your microphone for voice conversations.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      console.log('🎙️ Microphone permission result:', granted);

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('✅ Microphone permission GRANTED - voice input should work');
      } else if (granted === PermissionsAndroid.RESULTS.DENIED) {
        console.log('⚠️ Microphone permission DENIED - voice input will NOT work');
        audioInitState.error = 'Microphone permission denied';
      } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        console.log('❌ Microphone permission NEVER_ASK_AGAIN - user must enable in settings');
        audioInitState.error = 'Microphone permission blocked - enable in app settings';
      }
    }

    // Only mark as initialized if there's no error from permission check
    if (!audioInitState.error) {
      audioInitState.isInitialized = true;
      console.log('✅ Audio subsystem pre-initialized');
    } else {
      audioInitState.isInitialized = false;
      console.log('⚠️ Audio subsystem NOT initialized due to error:', audioInitState.error);
    }
  } catch (error) {
    audioInitState.error = String(error);
    console.error('❌ Audio pre-initialization error:', error);
  } finally {
    audioInitState.isInitializing = false;
  }
};

// Voice modal component that uses the context
function VoiceModalRenderer() {
  const { isModalVisible, modalAgentId, modalAgentName, hideVoiceModal, onTranscriptReady } = useVoiceAgentModal();

  return (
    <VoiceAgentModal
      visible={isModalVisible}
      onClose={hideVoiceModal}
      agentId={modalAgentId}
      agentName={modalAgentName}
      onTranscriptReady={onTranscriptReady}
    />
  );
}

// Audio initializer component - runs once on app mount
function AudioInitializer() {
  useEffect(() => {
    // Pre-initialize audio on app start to prevent first-press crash
    preInitializeAudio();
  }, []);

  return null;
}

// Custom toast configuration matching app theme
const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#FFD900',
        backgroundColor: 'rgb(48, 48, 46)',
        borderLeftWidth: 4,
        borderRadius: 8,
        height: 60,
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
      }}
      text1Style={{
        fontSize: 14,
        fontWeight: '600' as any,
        color: '#FFFFFF',
      }}
      text2Style={{
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
      }}
    />
  ),
  error: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#FF4444',
        backgroundColor: 'rgb(48, 48, 46)',
        borderLeftWidth: 4,
        borderRadius: 8,
        height: 60,
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
      }}
      text1Style={{
        fontSize: 14,
        fontWeight: '600' as any,
        color: '#FFFFFF',
      }}
      text2Style={{
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
      }}
    />
  ),
};

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <ElevenLabsProvider>
        <PaperProvider theme={theme}>
          <VoiceAgentProvider>
            <AudioInitializer />
            <AppNavigator />
            <VoiceModalRenderer />
            <Toast config={toastConfig} />
          </VoiceAgentProvider>
        </PaperProvider>
      </ElevenLabsProvider>
    </Provider>
  );
}

export default App;
