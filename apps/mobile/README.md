# BG OS Mobile App

React Native mobile application for BG OS AI Assistant (Android/iOS).

## Features

- 🔐 **Authentication** - Secure login with token-based auth
- 💬 **Real-time Chat** - Message your AI assistants
- 📱 **Offline Support** - AsyncStorage for offline data
- 🔄 **Pull to Refresh** - Update chats and messages
- 🎨 **Dark Theme** - Beautiful Material Design UI
- ⚡ **Fast & Responsive** - Optimized with hooks and memoization

## Tech Stack

- **React Native** 0.76
- **TypeScript** 5.8
- **Redux Toolkit** - State management
- **React Navigation** - Navigation
- **React Native Paper** - UI components
- **AsyncStorage** - Local storage
- **Axios** - HTTP client

## Project Structure

```
apps/mobile/
├── src/
│   ├── components/      # Reusable components
│   │   └── chat/        # Chat-specific components
│   ├── hooks/           # Custom React hooks
│   ├── navigation/      # React Navigation setup
│   ├── screens/         # Screen components
│   │   ├── auth/        # Authentication screens
│   │   ├── chat/        # Chat screens
│   │   └── settings/    # Settings screens
│   ├── services/        # API & business logic
│   ├── theme/           # Theme configuration
│   └── utils/           # Utility functions
├── android/             # Android native code
├── ios/                 # iOS native code
├── App.tsx              # Root component
├── index.js             # Entry point
└── package.json         # Dependencies
```

## Prerequisites

- Node.js >= 18
- PNPM >= 8
- React Native development environment
  - **Android**: Android Studio + Android SDK
  - **iOS**: Xcode (Mac only)

## Getting Started

### 1. Install Dependencies

```bash
# From repository root
pnpm install

# Build shared packages
pnpm run build:shared
```

### 2. Start Metro Bundler

```bash
cd apps/mobile
pnpm start
```

### 3. Run on Device/Emulator

**Android:**
```bash
pnpm run android
```

**iOS (Mac only):**
```bash
pnpm run ios
```

## Development

### Running from Root

```bash
# From repository root
pnpm mobile
```

### Hot Reload

Metro bundler supports hot reload. Press `r` in the terminal to reload, or shake the device to open the developer menu.

### Debugging

**React Native Debugger:**
1. Install [React Native Debugger](https://github.com/jhen0409/react-native-debugger)
2. Open developer menu (shake device or Cmd+D on iOS / Cmd+M on Android)
3. Select "Debug"

**Chrome DevTools:**
1. Open developer menu
2. Select "Debug with Chrome"
3. Open `chrome://inspect` in Chrome

### Clearing Cache

```bash
pnpm start --reset-cache
```

## Shared Packages

The mobile app uses shared packages from the monorepo:

- `@bgos/shared-types` - TypeScript types
- `@bgos/shared-logic` - Business logic & utilities
- `@bgos/shared-services` - API integration
- `@bgos/shared-state` - Redux store

### Updating Shared Packages

```bash
# From repository root
pnpm run build:shared
```

## Configuration

### Metro Configuration

Metro is configured for monorepo support in `metro.config.js`:
- Watches workspace root
- Resolves shared packages from source
- Supports TypeScript path mappings

### TypeScript Paths

TypeScript is configured to resolve shared packages:
```json
{
  "paths": {
    "@bgos/shared-types": ["../../packages/shared-types/src"],
    "@bgos/shared-logic": ["../../packages/shared-logic/src"],
    "@bgos/shared-services": ["../../packages/shared-services/src"],
    "@bgos/shared-state": ["../../packages/shared-state/src"]
  }
}
```

## Scripts

```bash
pnpm start          # Start Metro bundler
pnpm run android    # Run on Android
pnpm run ios        # Run on iOS
pnpm test           # Run tests
pnpm lint           # Run ESLint
```

## Building for Production

### Android

```bash
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

### iOS

1. Open `ios/BGOSMobile.xcworkspace` in Xcode
2. Select Product → Archive
3. Follow distribution steps

## Features & Screens

### Login Screen
- Email/password authentication
- Form validation
- Loading states
- Toast notifications

### Chat List Screen
- List of all chats
- Unread message badges
- Pull-to-refresh
- Empty state
- FAB for new chat

### Chat Screen
- Message history
- Message bubbles (user vs assistant)
- Timestamps
- Auto-scroll to bottom
- Keyboard avoidance
- Message input with character limit

### Settings Screen
- User profile
- Theme preferences
- App information
- Logout

## State Management

### Redux Store

```typescript
import { createStore, UserActions } from '@bgos/shared-state';

const store = createStore();
dispatch(UserActions.login({ user, token }));
```

### Custom Hooks

**useLoadInitialData** - Load assistants and chats
```typescript
import { useLoadInitialData } from './hooks/useLoadInitialData';

const { assistants } = useLoadInitialData();
```

**useChatHistory** - Manage chat messages
```typescript
import { useChatHistory } from './hooks/useChatHistory';

const { loadChatHistory, sendMessage, loading } = useChatHistory(
  userId,
  chatId,
  token
);
```

## Offline Support

### AsyncStorage

Data is persisted locally using AsyncStorage:
- User tokens
- User data
- Chat cache (future)

```typescript
import { storage } from './utils/storage';

await storage.saveToken(token);
const token = await storage.getToken();
```

## Troubleshooting

### Metro bundler won't start
```bash
cd apps/mobile
pnpm start --reset-cache
```

### Android build fails
```bash
cd android
./gradlew clean
cd ..
pnpm run android
```

### iOS build fails
```bash
cd ios
pod install
cd ..
pnpm run ios
```

### TypeScript errors for shared packages
```bash
# From repository root
pnpm run build:shared
```

### "Unable to resolve module" errors
1. Clear Metro cache: `pnpm start --reset-cache`
2. Rebuild shared packages: `pnpm run build:shared`
3. Reinstall dependencies: `rm -rf node_modules && pnpm install`

## Contributing

1. Create feature branch from `main`
2. Make changes
3. Test on both Android and iOS (if possible)
4. Run `pnpm run build:shared` before committing
5. Create pull request

## Known Issues

1. **Mock Authentication** - Currently using mock auth, needs real backend integration
2. **No Real-time Messages** - Messages not synced in real-time (needs WebSocket)
3. **No Push Notifications** - Planned for future update
4. **No File Attachments** - Planned for future update

## Roadmap

### Phase 3 (Planned)
- [ ] Real n8n backend integration
- [ ] WebSocket for real-time messaging
- [ ] Push notifications (FCM)
- [ ] File/image attachments
- [ ] Voice message recording
- [ ] Message search
- [ ] Chat export

### Future
- [ ] Biometric authentication
- [ ] Dark/light theme toggle
- [ ] Multiple language support
- [ ] Message reactions
- [ ] Read receipts
- [ ] Typing indicators

## Resources

- [React Native Docs](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting)
2. Review [Known Issues](#known-issues)
3. Open an issue on GitHub

## License

MIT

## Authors

Denis Zhigulin & Denis Klimov
