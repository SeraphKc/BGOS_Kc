# Shared Package Development Context

> **Scope:** Developing and maintaining shared packages (`@bgos/shared-*`)

---

## 🎯 You Are Now in Shared Package Mode

**Working Directory:** `packages/`
**Focus:** Platform-agnostic code shared between mobile and desktop
**Goal:** Create reusable, well-tested, documented code

---

## 📦 Shared Packages Overview

```
packages/
├── shared-types/      # TypeScript types & interfaces
├── shared-logic/      # Business logic & utilities
├── shared-services/   # API integration (n8n)
└── shared-state/      # Redux Toolkit state management
```

---

## 🏗️ Package Structure Standards

### Each Package Should Have:

```
packages/shared-[name]/
├── src/
│   ├── index.ts           # Main export file (barrel export)
│   ├── [feature]/         # Feature-specific code
│   │   ├── index.ts      # Feature exports
│   │   └── [files].ts
│   └── ...
├── dist/                  # Build output (auto-generated)
├── package.json           # Package configuration
├── tsconfig.json          # TypeScript configuration
├── README.md              # Package documentation
└── .gitignore
```

---

## 📝 `@bgos/shared-types`

### Purpose
TypeScript type definitions and interfaces used across all platforms.

### Location
`packages/shared-types/src/`

### What Belongs Here

**Add types that:**
- Represent domain entities (Chat, Assistant, User)
- Are used in multiple places across mobile and desktop
- Define data structures from API responses
- Define component props shared between platforms
- Define enums and constants

**Examples:**
```typescript
// ✅ Good - Domain entity
export interface Chat {
  id: string;
  assistantId: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

// ✅ Good - Shared enum
export enum MessageStatus {
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed',
  RECEIVED = 'received'
}

// ❌ Bad - Platform-specific type (belongs in app)
export interface ReactNativeStyleProp {
  // React Native specific
}
```

### Adding a New Type

```bash
# 1. Create the type file
cd packages/shared-types/src
# Create NewEntity.ts

# 2. Define the type
cat > NewEntity.ts << 'EOF'
export interface NewEntity {
  id: string;
  name: string;
  createdAt: Date;
}
EOF

# 3. Export from index.ts
echo "export * from './NewEntity';" >> index.ts

# 4. Build the package
cd ..
npm run build

# 5. Use in apps
# import type { NewEntity } from '@bgos/shared-types';
```

---

## 🧰 `@bgos/shared-logic`

### Purpose
Platform-agnostic business logic, utilities, and helper functions.

### Location
`packages/shared-logic/src/utils/`

### What Belongs Here

**Add utilities that:**
- Perform calculations or transformations
- Format data (dates, strings, numbers)
- Validate input
- Implement business rules
- Are pure functions (no side effects)
- Don't depend on platform-specific APIs

**Examples:**
```typescript
// ✅ Good - Pure utility function
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();
}

// ✅ Good - Date formatting
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  // ...
}

// ❌ Bad - Platform-specific (uses React Native API)
export function getDeviceInfo() {
  return {
    width: Dimensions.get('window').width,  // React Native specific!
    height: Dimensions.get('window').height
  };
}

// ❌ Bad - Has side effects (API call)
export async function fetchUserData(userId: string) {
  return await fetch(`/users/${userId}`);  // Should be in shared-services!
}
```

### Adding a New Utility

```bash
# 1. Create or edit utility file
cd packages/shared-logic/src/utils
# Create stringUtils.ts or add to existing file

# 2. Implement the utility
cat > stringUtils.ts << 'EOF'
/**
 * Capitalizes the first letter of a string.
 * @param str - The input string
 * @returns The capitalized string
 * @example
 * capitalize("hello") // "Hello"
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
EOF

# 3. Export from utils/index.ts
echo "export * from './stringUtils';" >> index.ts

# 4. Export from package index.ts
cd ..
# Add to src/index.ts if not already exporting utils

# 5. Build
cd ..
npm run build

# 6. Write tests
# src/utils/stringUtils.test.ts
```

---

## 🌐 `@bgos/shared-services`

### Purpose
API integration services for communicating with n8n backend.

### Location
`packages/shared-services/src/api/`

### What Belongs Here

**Add services that:**
- Make HTTP requests to backend
- Handle API responses and errors
- Transform API data to app types
- Implement API client configuration
- Are platform-agnostic (no Electron IPC, no React Native specific)

**Examples:**
```typescript
// ✅ Good - API service
import { apiClient } from './client';
import type { Chat } from '@bgos/shared-types';

export async function fetchChats(userId: string): Promise<Chat[]> {
  const response = await apiClient.get(`/chats/${userId}`);
  return response.data;
}

// ✅ Good - API client configuration
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'https://n8n-test.brandgrowthos.ai/webhook/...',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ❌ Bad - Platform-specific (Electron IPC)
export async function syncLocalDatabase() {
  return await ipcRenderer.invoke('sync-db');  // Electron specific!
}

// ❌ Bad - Platform-specific (React Native AsyncStorage)
export async function saveToken(token: string) {
  await AsyncStorage.setItem('token', token);  // React Native specific!
}
```

### Adding a New Service

```bash
# 1. Add to appropriate API file
cd packages/shared-services/src/api
# Edit chatApi.ts, assistantApi.ts, or create new file

# 2. Implement the service
# Add to chatApi.ts
cat >> chatApi.ts << 'EOF'

/**
 * Archives a chat.
 * @param userId - The user ID
 * @param chatId - The chat ID
 * @returns Promise that resolves when chat is archived
 */
export async function archiveChat(userId: string, chatId: string): Promise<void> {
  await apiClient.patch(`/chats/${userId}/${chatId}`, { archived: true });
}
EOF

# 3. Export from index.ts
# Add to src/index.ts if not already exporting chatApi

# 4. Build
cd ../..
npm run build

# 5. Use in apps
# import { archiveChat } from '@bgos/shared-services';
```

---

## 🗄️ `@bgos/shared-state`

### Purpose
Redux Toolkit state management (slices, store, actions, selectors).

### Location
`packages/shared-state/src/`

### What Belongs Here

**Add state that:**
- Is shared between mobile and desktop
- Represents application state (not platform state)
- Includes reducers, actions, and selectors
- Uses Redux Toolkit patterns

**Examples:**
```typescript
// ✅ Good - Shared state slice
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Chat } from '@bgos/shared-types';

interface ChatState {
  list: Chat[];
  activeChat: Chat | null;
  loading: boolean;
  error: string | null;
}

const chatSlice = createSlice({
  name: 'chats',
  initialState: {
    list: [],
    activeChat: null,
    loading: false,
    error: null,
  } as ChatState,
  reducers: {
    setChats(state, action: PayloadAction<Chat[]>) {
      state.list = action.payload;
      state.loading = false;
    },
    setActiveChat(state, action: PayloadAction<Chat>) {
      state.activeChat = action.payload;
    },
  },
});

export const ChatActions = chatSlice.actions;
export default chatSlice.reducer;

// ❌ Bad - Platform-specific state (belongs in app)
const electronWindowSlice = createSlice({
  name: 'window',
  initialState: { isMaximized: false },  // Desktop specific!
  reducers: { /* ... */ }
});
```

### Adding a New Slice

```bash
# 1. Create the slice file
cd packages/shared-state/src/slices
# Create NotificationSlice.ts

# 2. Implement the slice
cat > NotificationSlice.ts << 'EOF'
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Notification } from '@bgos/shared-types';

interface NotificationState {
  list: Notification[];
  unreadCount: number;
}

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    list: [],
    unreadCount: 0,
  } as NotificationState,
  reducers: {
    setNotifications(state, action: PayloadAction<Notification[]>) {
      state.list = action.payload;
      state.unreadCount = action.payload.filter(n => !n.read).length;
    },
    markAsRead(state, action: PayloadAction<string>) {
      const notification = state.list.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
        state.unreadCount--;
      }
    },
  },
});

export const NotificationActions = notificationSlice.actions;
export default notificationSlice.reducer;
EOF

# 3. Add to store.ts
# Edit src/store.ts and add notification reducer

# 4. Export from index.ts
echo "export { NotificationActions } from './slices/NotificationSlice';" >> ../index.ts

# 5. Build
cd ../..
npm run build

# 6. Use in apps
# import { NotificationActions } from '@bgos/shared-state';
```

---

## ✅ Shared Package Development Rules

### Rule #1: No Platform Dependencies

**Shared packages MUST NOT import:**
- `react-native` (mobile-specific)
- `electron` (desktop-specific)
- `@react-navigation` (mobile-specific)
- Platform-specific libraries

**Shared packages CAN import:**
- `@reduxjs/toolkit` (platform-agnostic)
- `axios` (platform-agnostic)
- Other shared packages (`@bgos/shared-*`)
- Standard libraries (`date-fns`, `lodash`, etc.)

```typescript
// ❌ BAD - Platform dependency in shared package
import { Dimensions } from 'react-native';
import { ipcRenderer } from 'electron';

// ✅ GOOD - Platform-agnostic dependencies
import axios from 'axios';
import type { Chat } from '@bgos/shared-types';
```

### Rule #2: Pure Functions Preferred

Utilities in `shared-logic` should be pure functions when possible.

```typescript
// ✅ Good - Pure function
export function calculateTotal(items: number[]): number {
  return items.reduce((sum, item) => sum + item, 0);
}

// ❌ Bad - Side effects
let totalCache = 0;
export function calculateTotal(items: number[]): number {
  totalCache = items.reduce((sum, item) => sum + item, 0);  // Mutates external state
  return totalCache;
}
```

### Rule #3: Document Public APIs

All exported functions, types, and classes MUST have JSDoc comments.

```typescript
/**
 * Fetches all chats for a user.
 * @param userId - The unique identifier of the user
 * @returns Promise that resolves to an array of chats
 * @throws {Error} If the API request fails
 * @example
 * ```typescript
 * const chats = await fetchChats('user_123');
 * console.log(chats.length);
 * ```
 */
export async function fetchChats(userId: string): Promise<Chat[]> {
  const response = await apiClient.get(`/chats/${userId}`);
  return response.data;
}
```

### Rule #4: Write Tests

All shared code MUST have unit tests.

```typescript
// packages/shared-logic/src/utils/stringUtils.test.ts
import { capitalize } from './stringUtils';

describe('stringUtils', () => {
  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(capitalize('')).toBe('');
    });

    it('should handle single character', () => {
      expect(capitalize('a')).toBe('A');
    });
  });
});
```

### Rule #5: Barrel Exports

Always export from `index.ts` for clean imports.

```typescript
// packages/shared-logic/src/index.ts
export * from './utils/avatarUtils';
export * from './utils/colors';
export * from './utils/dateFormatter';
export * from './utils/stringUtils';

// Enables clean imports in apps:
// import { getInitials, COLORS, getRelativeTime, capitalize } from '@bgos/shared-logic';
```

---

## 🔄 Shared Package Workflow

### 1. Planning

Before adding code to shared packages:

- [ ] Is this code used by 2+ platforms? (If not, keep it local)
- [ ] Is this code platform-agnostic? (No RN or Electron deps)
- [ ] Which package does it belong in?
  - Types → `shared-types`
  - Logic → `shared-logic`
  - API → `shared-services`
  - State → `shared-state`

### 2. Development

```bash
# Navigate to package
cd packages/shared-[name]

# Install dependencies
npm install

# Make changes to src/

# Build
npm run build

# Run tests
npm test

# Watch mode (auto-rebuild on changes)
npm run dev
```

### 3. Testing in Apps

```bash
# After building shared package, test in apps
cd ../../apps/mobile
npm install  # Picks up latest build
npm run start

# Or desktop
cd ../../
npm run dev
```

### 4. Committing

```bash
# From monorepo root
git add packages/shared-[name]
git commit -m "feat(shared-logic): add capitalize utility"
```

---

## 🧪 Testing Shared Packages

### Unit Tests

```typescript
// packages/shared-logic/src/utils/dateFormatter.test.ts
import { getRelativeTime } from './dateFormatter';

describe('getRelativeTime', () => {
  it('should return "Just now" for current time', () => {
    const now = new Date();
    expect(getRelativeTime(now)).toBe('Just now');
  });

  it('should return "X minutes ago" for recent time', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(getRelativeTime(fiveMinutesAgo)).toBe('5 minutes ago');
  });

  it('should return "X hours ago" for times within 24 hours', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(getRelativeTime(twoHoursAgo)).toBe('2 hours ago');
  });
});
```

### Integration Tests

Test how shared packages work together:

```typescript
// packages/shared-state/src/slices/ChatSlice.test.ts
import { configureStore } from '@reduxjs/toolkit';
import chatReducer, { ChatActions } from './ChatSlice';
import type { Chat } from '@bgos/shared-types';

describe('ChatSlice', () => {
  it('should add chat to list', () => {
    const store = configureStore({ reducer: { chats: chatReducer } });

    const newChat: Chat = {
      id: '1',
      assistantId: 'asst_1',
      userId: 'user_1',
      title: 'Test Chat',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    store.dispatch(ChatActions.addChat(newChat));

    const state = store.getState();
    expect(state.chats.list).toHaveLength(1);
    expect(state.chats.list[0]).toEqual(newChat);
  });
});
```

---

## 📚 Package Documentation

### README Template

Each shared package should have a `README.md`:

```markdown
# @bgos/shared-[name]

Brief description of what this package provides.

## Installation

This package is part of the BGOS_Kc monorepo.

## Usage

import { Something } from '@bgos/shared-[name]';

const result = Something();


## API Reference

### `functionName(param: Type): ReturnType`

Description of what the function does.

**Parameters:**
- `param` - Description

**Returns:** Description

**Example:**
typescript
const result = functionName('value');
```

---

## 🔧 Build Configuration

### TypeScript Config

```json
// packages/shared-[name]/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### Package.json

```json
{
  "name": "@bgos/shared-[name]",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "jest"
  },
  "dependencies": {
    // Production dependencies only
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

---

## 🎯 Shared Package Checklist

**Before adding new code:**
- [ ] Is this used by 2+ platforms?
- [ ] Is this platform-agnostic?
- [ ] Is the package choice correct?
- [ ] No platform-specific dependencies?

**During development:**
- [ ] Pure functions when possible?
- [ ] JSDoc comments added?
- [ ] Unit tests written?
- [ ] Exported from `index.ts`?

**Before committing:**
- [ ] Built successfully? (`npm run build`)
- [ ] Tests passing? (`npm test`)
- [ ] Tested in apps?
- [ ] Documentation updated?

---

## 📝 Summary

**Shared Package Development = Platform-Agnostic Code Only**

- ✅ Create code used by multiple platforms
- ✅ Keep it pure and testable
- ✅ Document everything
- ✅ Write tests
- ✅ Export via barrel exports
- ❌ No platform-specific dependencies
- ❌ No side effects when avoidable
- ❌ No undocumented APIs

**You're in shared package mode. Focus on creating reusable, platform-agnostic code that both mobile and desktop can use!**

**Remember: Shared packages are the foundation of the monorepo. Keep them clean, documented, and well-tested!**
