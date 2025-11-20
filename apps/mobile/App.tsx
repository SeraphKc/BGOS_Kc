import React from 'react';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import Toast, { BaseToast } from 'react-native-toast-message';
import { ElevenLabsProvider } from '@elevenlabs/react-native';
import { createStore } from '@bgos/shared-state';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/theme/theme';
import { VoiceAgentProvider } from './src/contexts/VoiceAgentContext';

const store = createStore();

// Custom toast configuration
const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#FFD900',
        backgroundColor: 'rgb(48, 48, 46)',
        borderLeftWidth: 4,
        borderRadius: 8,
        height: 50,
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
      }}
      text1Style={{
        fontSize: 14,
        fontWeight: '500' as any,
        color: '#FFFFFF',
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
            <AppNavigator />
            <Toast config={toastConfig} />
          </VoiceAgentProvider>
        </PaperProvider>
      </ElevenLabsProvider>
    </Provider>
  );
}

export default App;
