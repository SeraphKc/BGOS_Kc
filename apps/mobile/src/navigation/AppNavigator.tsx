import React from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Dimensions } from 'react-native';
import LoadingScreen from '../screens/LoadingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import AgentSelectionScreen from '../screens/chat/AgentSelectionScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import { VoiceAgentScreen } from '../screens/voice/VoiceAgentScreen';
import { VoiceErrorBoundary } from '../components/voice/VoiceErrorBoundary';
import { Sidebar } from '../components/sidebar/Sidebar';

// Wrapped VoiceAgentScreen with error boundary
function VoiceAgentWithErrorBoundary() {
  const navigation = useNavigation();

  const handleReset = () => {
    // Navigate back on error reset
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <VoiceErrorBoundary onReset={handleReset}>
      <VoiceAgentScreen />
    </VoiceErrorBoundary>
  );
}

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Get screen width for drawer (90% width to show screen behind)
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.9; // 90% width

// Main app screens with drawer navigation
function MainAppNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <Sidebar {...props} />}
      screenOptions={{
        drawerType: 'front',
        drawerStyle: {
          width: DRAWER_WIDTH, // 90% width to show 10% of screen behind
        },
        headerShown: false,
        swipeEnabled: true,
        swipeEdgeWidth: 50,
        overlayColor: 'transparent', // No overlay so the 10% is visible and tappable
      }}
    >
      <Drawer.Screen name="Chat" component={ChatScreen} />
      <Drawer.Screen name="ChatList" component={ChatListScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
}

// Root navigator with auth flow
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Loading"
        screenOptions={{
          headerStyle: { backgroundColor: '#1F1E1C' },
          headerTintColor: '#FFFFFF',
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="Loading"
          component={LoadingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AgentSelection"
          component={AgentSelectionScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Main"
          component={MainAppNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="VoiceAgent"
          component={VoiceAgentScreen}  // Temporarily removed error boundary to test
          options={{
            headerShown: false,
            presentation: 'containedModal', // Testing containedModal - different native implementation
            animation: 'slide_from_bottom',
            gestureEnabled: false, // Disable gestures to prevent accidental dismissal
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
