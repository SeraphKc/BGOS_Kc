# Mobile Development Context

> **Scope:** React Native mobile app (Android/iOS) development

---

## 🎯 You Are Now in Mobile Mode

**Working Directory:** `apps/mobile/`
**Platform:** React Native (Android & iOS)
**Status:** ✅ Mobile correctly uses all shared packages

---

## 📱 Mobile-Specific Guidelines

### What Belongs in Mobile

**Platform-Specific Code:**
- React Native components (`<View>`, `<Text>`, `<FlatList>`, `<TouchableOpacity>`)
- Navigation setup (React Navigation)
- AsyncStorage operations
- Native module integrations (camera, permissions, etc.)
- Platform-specific styling (SafeAreaView, StatusBar)
- React Native hooks (useWindowDimensions, useColorScheme)

**Example:**
```typescript
// apps/mobile/src/screens/chat/ChatScreen.tsx
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

// Mobile-specific UI code
```

---

### What Does NOT Belong in Mobile

**Use Shared Packages For:**
- Business logic → `@bgos/shared-logic`
- API calls → `@bgos/shared-services`
- Types → `@bgos/shared-types`
- State management → `@bgos/shared-state`

**Example:**
```typescript
// ❌ DON'T create these in mobile
// apps/mobile/src/types/Chat.ts
// apps/mobile/src/utils/dateFormatter.ts
// apps/mobile/src/services/chatApi.ts

// ✅ DO import from shared
import type { Chat } from '@bgos/shared-types';
import { getRelativeTime } from '@bgos/shared-logic';
import { fetchChats } from '@bgos/shared-services';
```

---

## 🏗️ Mobile App Structure

```
apps/mobile/src/
├── components/         # React Native components
│   ├── chat/          # Chat-specific components
│   ├── dialogs/       # Dialog components
│   ├── icons/         # Icon components
│   ├── modals/        # Modal components
│   ├── sidebar/       # Sidebar components
│   └── voice/         # Voice-related components
├── contexts/          # React Context providers
├── hooks/             # Custom React hooks
│   ├── useChatHistory.ts
│   └── useLoadInitialData.ts
├── navigation/        # React Navigation setup
│   └── AppNavigator.tsx
├── screens/           # Screen components
│   ├── auth/          # LoginScreen
│   ├── chat/          # ChatScreen, ChatListScreen, AgentSelectionScreen
│   ├── settings/      # SettingsScreen
│   └── voice/         # VoiceAgentScreen
├── services/          # Mobile-specific services
│   ├── api/           # axiosConfig.ts (mobile HTTP client wrapper)
│   ├── AudioPlaybackService.ts
│   ├── AudioRecordingService.ts
│   ├── AuthService.ts
│   ├── chatService.ts
│   ├── elevenLabsService.ts
│   └── webhookService.ts
├── theme/             # Theme configuration
├── types/             # Mobile-specific types (NOT shared types)
└── utils/             # Mobile-specific utilities (storage, etc.)
```

---

## ✅ Mobile Does It Right

**Mobile is the reference implementation for shared package usage.**

### Correct Store Setup

```typescript
// apps/mobile/App.tsx
import { createStore } from '@bgos/shared-state';
import { Provider } from 'react-redux';

const store = createStore();

function App() {
  return (
    <Provider store={store}>
      {/* ... */}
    </Provider>
  );
}
```

### Correct Imports

```typescript
// Example from ChatScreen.tsx
import type { Chat, ChatHistory } from '@bgos/shared-types';
import { getRelativeTime, COLORS } from '@bgos/shared-logic';
import { ChatActions, type RootState } from '@bgos/shared-state';
import { fetchAssistantsWithChats } from '@bgos/shared-services';

// Then use them
const chats = useSelector((state: RootState) => state.chats.list);
dispatch(ChatActions.setActiveChat(chat));
```

---

## 🎨 Mobile Development Patterns

### Pattern 1: Screen Components

```typescript
// apps/mobile/src/screens/chat/ChatScreen.tsx
import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';

// Shared imports
import type { Chat, ChatHistory } from '@bgos/shared-types';
import { ChatActions, type RootState } from '@bgos/shared-state';
import { getRelativeTime } from '@bgos/shared-logic';

// Local mobile components
import { MessageBubble } from '../../components/chat/MessageBubble';

export function ChatScreen() {
  const dispatch = useDispatch();
  const messages = useSelector((state: RootState) =>
    state.chatHistory.messages[activeChat?.id]
  );

  // Mobile-specific UI
  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={({ item }) => <MessageBubble message={item} />}
      />
    </View>
  );
}
```

### Pattern 2: Custom Hooks

```typescript
// apps/mobile/src/hooks/useChatHistory.ts
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

// Shared imports
import { ChatHistoryActions } from '@bgos/shared-state';
import { fetchChatHistory } from '@bgos/shared-services';

export function useChatHistory(chatId: string) {
  const dispatch = useDispatch();

  useEffect(() => {
    // Fetch and update shared state
    fetchChatHistory(chatId).then(messages => {
      dispatch(ChatHistoryActions.setMessages({ chatId, messages }));
    });
  }, [chatId]);
}
```

### Pattern 3: Navigation

```typescript
// apps/mobile/src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import { ChatScreen } from '../screens/chat/ChatScreen';
import { ChatListScreen } from '../screens/chat/ChatListScreen';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="ChatList" component={ChatListScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

## 🔧 Mobile-Specific Services

### When to Create Mobile Services

Create services in `apps/mobile/src/services/` when:
- Wrapping React Native APIs (audio recording, camera, etc.)
- Platform-specific implementations (AsyncStorage, push notifications)
- Extending shared services with mobile-specific logic

### Mobile Service Pattern

```typescript
// apps/mobile/src/services/AudioRecordingService.ts
import { Audio } from 'expo-av';
import { VoiceActions } from '@bgos/shared-state';
import { store } from '../App';

export class AudioRecordingService {
  private recording: Audio.Recording | null = null;

  async startRecording() {
    // React Native specific code
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') return;

    this.recording = new Audio.Recording();
    await this.recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await this.recording.startAsync();

    // Update shared state
    store.dispatch(VoiceActions.startRecording());
  }

  async stopRecording() {
    if (!this.recording) return;

    await this.recording.stopAndUnloadAsync();
    const uri = this.recording.getURI();

    // Update shared state
    store.dispatch(VoiceActions.stopRecording());

    return uri;
  }
}
```

---

## 📲 Mobile-Specific Considerations

### AsyncStorage

```typescript
// apps/mobile/src/utils/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@bgos/shared-types';

export async function saveUser(user: User) {
  await AsyncStorage.setItem('user', JSON.stringify(user));
}

export async function loadUser(): Promise<User | null> {
  const data = await AsyncStorage.getItem('user');
  return data ? JSON.parse(data) : null;
}
```

### Platform Detection

```typescript
import { Platform } from 'react-native';

// Use Platform.OS for platform-specific logic
const isIOS = Platform.OS === 'ios';
const isAndroid = Platform.OS === 'android';

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
  },
});
```

### Responsive Design

```typescript
import { useWindowDimensions } from 'react-native';

function MyComponent() {
  const { width, height } = useWindowDimensions();

  return (
    <View style={{ width: width * 0.8 }}>
      {/* Responsive content */}
    </View>
  );
}
```

---

## 🎨 Theming

### Mobile Theme Structure

```typescript
// apps/mobile/src/theme/colors.ts
import { COLORS } from '@bgos/shared-logic';

// Extend shared colors with mobile-specific needs
export const MobileTheme = {
  ...COLORS,
  statusBar: COLORS.PRIMARY,
  navigationBar: COLORS.BACKGROUND,
  // Mobile-specific color variations
};
```

---

## 🧪 Testing Mobile Components

### Component Tests

```typescript
// apps/mobile/src/components/chat/MessageBubble.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { MessageBubble } from './MessageBubble';
import type { ChatHistory, Sender } from '@bgos/shared-types';
import { MessageStatus } from '@bgos/shared-types';

describe('MessageBubble', () => {
  it('renders user message correctly', () => {
    const message: ChatHistory = {
      id: '1',
      chatId: 'chat_1',
      sender: Sender.USER,
      content: 'Hello',
      timestamp: new Date(),
      status: MessageStatus.SENT,
    };

    const { getByText } = render(<MessageBubble message={message} />);
    expect(getByText('Hello')).toBeTruthy();
  });
});
```

---

## 🚀 Running Mobile App

### Development

```bash
# Navigate to mobile directory
cd apps/mobile

# Install dependencies
npm install

# Start Metro bundler
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

### Building

```bash
# iOS
cd ios && pod install && cd ..
npm run build:ios

# Android
npm run build:android
```

---

## ✅ Mobile Development Checklist

**Before creating new code:**
- [ ] Is this React Native UI? → Create in `apps/mobile/src/components/`
- [ ] Is this business logic? → Add to `@bgos/shared-logic`
- [ ] Is this a type? → Add to `@bgos/shared-types`
- [ ] Is this an API call? → Add to `@bgos/shared-services`
- [ ] Is this state management? → Add to `@bgos/shared-state`
- [ ] Is this mobile-specific service? → Create in `apps/mobile/src/services/`

**Before importing:**
- [ ] Using `@bgos/shared-*` for shared code?
- [ ] Not importing from desktop (`../../src/`)?
- [ ] Not creating local copies of shared code?

---

## 🎯 Key Reminders

1. **Mobile is the gold standard** - It uses shared packages correctly
2. **React Native only** - Use RN components, not web or Electron
3. **Shared packages first** - Always check before creating
4. **Platform-specific code only** - Everything else goes in shared
5. **Navigation is local** - React Navigation setup stays in mobile

---

## 📚 Mobile-Specific Resources

**Components:**
- React Native Docs: https://reactnative.dev/docs/components-and-apis
- React Navigation: https://reactnavigation.org/docs/getting-started

**Libraries:**
- AsyncStorage: `@react-native-async-storage/async-storage`
- SafeAreaView: `react-native-safe-area-context`
- Icons: Check `src/components/icons/`

**Shared Code:**
- Types: `@bgos/shared-types`
- Logic: `@bgos/shared-logic`
- Services: `@bgos/shared-services`
- State: `@bgos/shared-state`

---

## 🆘 Common Mobile Issues

### Issue: "Shared package not found"
```bash
# Build shared packages
cd ../../packages/shared-types
npm run build
cd ../../apps/mobile
npm install
```

### Issue: "Metro bundler cache issues"
```bash
npm start -- --reset-cache
```

### Issue: "Native module not found"
```bash
# iOS
cd ios && pod install && cd ..

# Android
cd android && ./gradlew clean && cd ..
```

---

## 📝 Summary

**Mobile Development = React Native UI + Shared Packages**

- ✅ Use React Native for UI
- ✅ Use shared packages for logic/state/types/API
- ✅ Create mobile-specific services when needed
- ✅ Follow mobile's example (it's correct!)
- ❌ Don't duplicate shared code
- ❌ Don't create local types/utils that belong in shared

**You're in mobile mode. Focus on React Native UI and use shared packages for everything else!**
