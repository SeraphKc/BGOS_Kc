import React from 'react';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { createStore } from '@bgos/shared-state';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/theme/theme';

const store = createStore();

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <PaperProvider theme={theme}>
        <AppNavigator />
      </PaperProvider>
    </Provider>
  );
}

export default App;
