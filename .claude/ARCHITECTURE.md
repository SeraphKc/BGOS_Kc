# BGOS_Kc Monorepo Architecture

> **Last Updated:** 2025-11-22
> **Status:** Desktop migration pending (documented technical debt)

## Overview

BGOS_Kc is a monorepo containing a React Native mobile app, an Electron desktop app, and shared packages for code reuse across platforms.

```
BGOS_Kc/
├── packages/           # Shared libraries (ALWAYS USE THESE)
│   ├── shared-types/      # TypeScript types & interfaces
│   ├── shared-logic/      # Business logic & utilities
│   ├── shared-services/   # API integration (n8n webhooks)
│   └── shared-state/      # Redux Toolkit state management
│
├── apps/
│   └── mobile/         # React Native app (Android/iOS)
│       └── src/
│
└── src/                # Electron desktop app (at root level)
```

---

## 🎯 Golden Rules

### Rule #1: ALWAYS Use Shared Packages
```typescript
// ✅ CORRECT
import { Chat, Assistant, User } from '@bgos/shared-types';
import { getInitials, COLORS } from '@bgos/shared-logic';
import { fetchAssistantsWithChats } from '@bgos/shared-services';
import { ChatActions, AssistantActions } from '@bgos/shared-state';

// ❌ WRONG - Never create local copies
import { Chat } from '../types/model/Chat';
import { getInitials } from '../utils/avatarUtils';
```

### Rule #2: Check Before Creating
Before writing any utility, type, or service:
1. Search `packages/shared-*` directories
2. Use `/check-shared` slash command
3. If it exists, import it. If not, add it to shared packages.

### Rule #3: Single Source of Truth
- Types → `@bgos/shared-types`
- Business logic → `@bgos/shared-logic`
- API calls → `@bgos/shared-services`
- State management → `@bgos/shared-state`

---

## 📦 Shared Packages Inventory

### `@bgos/shared-types`
TypeScript type definitions used across all apps.

**Location:** `packages/shared-types/src/`

**Contents:**
- `Assistant.ts` - Assistant entity type
- `Chat.ts` - Chat entity type
- `ChatHistory.ts` - Message history types (Sender, MessageStatus, FileInfo)
- `Notification.ts` - Notification types
- `User.ts` - User entity type
- `index.ts` - Re-exports all types

**Usage:**
```typescript
import { Chat, Assistant, User, ChatHistory, Sender } from '@bgos/shared-types';
```

---

### `@bgos/shared-logic`
Platform-agnostic business logic and utility functions.

**Location:** `packages/shared-logic/src/utils/`

**Contents:**
- `avatarUtils.ts` - Avatar initialization & color generation
  - `getInitials(name: string): string`
  - `getAvatarColor(name: string): string`
  - `avatarColors: string[]`
- `colors.ts` - Color constants and utilities
  - `COLORS` - Primary color palette
  - `WHITE_4_OPACITIES` - White opacity variants
  - `SEMANTIC_COLORS` - Semantic color mappings
  - `getColorWithOpacity(color: string, opacity: number): string`
- `dateFormatter.ts` - Date/time formatting utilities
  - `getRelativeTime(date: Date): string`
  - `getRelativeTimeFromChat(chat: Chat): string`
  - `compareChatsByDate(a: Chat, b: Chat): number`

**Usage:**
```typescript
import {
  getInitials,
  getAvatarColor,
  COLORS,
  getRelativeTime
} from '@bgos/shared-logic';
```

---

### `@bgos/shared-services`
API integration services for n8n webhook backend.

**Location:** `packages/shared-services/src/api/`

**Contents:**
- `client.ts` - Axios instance with base configuration
  - `apiClient` - Configured Axios instance
- `assistantApi.ts` - Assistant CRUD operations
  - `fetchAssistantsWithChats(userId: string)`
  - `createAssistant(...)`
  - `updateAssistant(...)`
  - `deleteAssistant(...)`
- `chatApi.ts` - Chat operations
  - `renameChat(userId, chatId, newTitle)`
  - `deleteChat(userId, chatId)`
  - `fetchChatName(userId, chatId)`
  - `assignScheduledChat(userId, chatId, scheduledChatId)`
- `databaseApi.ts` - Database sync operations
  - `syncDatabase(userId)`
- `mappers.ts` - Data mapping utilities

**Usage:**
```typescript
import {
  fetchAssistantsWithChats,
  renameChat,
  apiClient
} from '@bgos/shared-services';
```

---

### `@bgos/shared-state`
Redux Toolkit state management (slices, store, actions).

**Location:** `packages/shared-state/src/`

**Contents:**
- `slices/AssistantSlice.ts` - Assistant state management
- `slices/ChatSlice.ts` - Chat state management
- `slices/ChatHistorySlice.ts` - Message history state
- `slices/UISlice.ts` - UI state (sidebar, modals, etc.)
- `slices/UserSlice.ts` - User authentication state
- `slices/voiceSlice.ts` - Voice agent state
- `store.ts` - Redux store factory
  - `createStore()` - Creates configured Redux store

**Usage:**
```typescript
// Import store factory
import { createStore } from '@bgos/shared-state';
const store = createStore();

// Import actions and selectors
import {
  AssistantActions,
  ChatActions,
  UserActions,
  type RootState
} from '@bgos/shared-state';

// Use in components
dispatch(ChatActions.addMessage(message));
```

---

## 🏗️ Platform-Specific Boundaries

### What Belongs in Shared Packages

**Always shared:**
- TypeScript types and interfaces
- Business logic (calculations, formatting, validation)
- Data transformation utilities
- API client configuration
- Redux state management
- Constants and enums
- Pure functions (no platform dependencies)

### What Belongs in Mobile App (`apps/mobile/`)

**Mobile-specific:**
- React Native components (`<View>`, `<Text>`, etc.)
- Navigation (React Navigation)
- AsyncStorage operations
- Native module integration
- Platform permissions (camera, microphone, etc.)
- React Native-specific hooks
- Mobile UI theme

### What Belongs in Desktop App (`src/`)

**Desktop-specific:**
- Electron IPC services
- File system operations (read/write files)
- Window management
- Desktop-specific UI components (Electron-specific features)
- Desktop UI theme
- Native menus and shortcuts

---

## ⚠️ Known Technical Debt

### Desktop Duplication Issue

**Problem:** Desktop app has local copies of code that should use shared packages.

**Duplicated Files in Desktop:**
```
src/types/model/          → Should use @bgos/shared-types
src/utils/avatarUtils.ts  → Should use @bgos/shared-logic
src/utils/colors.ts       → Should use @bgos/shared-logic
src/utils/dateFormatter.ts → Should use @bgos/shared-logic
src/slices/*.ts           → Should use @bgos/shared-state
```

**Status:** Documented technical debt. Desktop will be migrated gradually over 3-4 weeks.

**Mobile Status:** ✅ Mobile correctly uses all shared packages (use as reference).

**Migration Strategy:** See `MIGRATION_PLAN.md` for phased approach.

---

## 🔄 Data Flow Architecture

```
┌─────────────────────────────────────────────────┐
│                  n8n Backend                     │
│         (Webhook-based REST API)                 │
└─────────────────┬───────────────────────────────┘
                  │
                  │ HTTP (Axios)
                  │
┌─────────────────▼───────────────────────────────┐
│          @bgos/shared-services                   │
│         (API Client & Services)                  │
└─────────────────┬───────────────────────────────┘
                  │
                  │ Dispatches Actions
                  │
┌─────────────────▼───────────────────────────────┐
│           @bgos/shared-state                     │
│          (Redux Store & Slices)                  │
└─────────────────┬───────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼──────┐   ┌────────▼─────┐
│  Mobile App  │   │  Desktop App │
│ (React Native)│   │  (Electron)  │
└──────────────┘   └──────────────┘
```

---

## 🎨 State Management Architecture

### Store Configuration

**Mobile (CORRECT):**
```typescript
// apps/mobile/App.tsx
import { createStore } from '@bgos/shared-state';
const store = createStore();
```

**Desktop (NEEDS MIGRATION):**
```typescript
// src/config/storeConfig.ts
// Currently uses local slices - should use shared store factory
import { createStore } from '@bgos/shared-state';
const store = createStore();
```

### State Slices

All state is managed through Redux Toolkit slices in `@bgos/shared-state`:

- **AssistantSlice** - Manages assistant list, selection, CRUD operations
- **ChatSlice** - Manages chat list, active chat, messages
- **ChatHistorySlice** - Manages message history, sending/receiving
- **UISlice** - Manages UI state (sidebar visibility, modals, etc.)
- **UserSlice** - Manages user authentication, profile
- **voiceSlice** - Manages voice agent state, recording, playback

---

## 🔌 API Integration

### Backend: n8n Webhooks

**Base URL:** `https://n8n-test.brandgrowthos.ai/webhook/b6f845bc-2d9c-43b2-8412-c81871c8bf89`

**Architecture:**
- n8n workflows expose REST API endpoints via webhooks
- All apps use Axios for HTTP requests
- Shared API client in `@bgos/shared-services`

### HTTP Client Strategy

**Current (Correct):**
```typescript
// packages/shared-services/src/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'https://n8n-test.brandgrowthos.ai/webhook/...',
  headers: { 'Content-Type': 'application/json' }
});
```

**Platform-Specific Extensions:**
- Mobile: Adds token interceptors in `apps/mobile/src/services/api/axiosConfig.ts`
- Desktop: Should use shared client (currently uses fetch - needs migration)

---

## 🧪 Testing Strategy

### Unit Tests
- Shared packages: Test utilities, services, reducers
- Location: `packages/*/src/**/*.test.ts`

### Integration Tests
- Platform-specific: Test API integration, navigation
- Mobile: `apps/mobile/src/**/*.test.tsx`
- Desktop: `src/**/*.test.tsx`

### E2E Tests
- Critical user flows
- Use platform-specific testing tools (Detox for mobile, Playwright for desktop)

---

## 📝 Code Organization Principles

### 1. DRY (Don't Repeat Yourself)
- If code is used in 2+ places, it belongs in shared packages
- No copy-paste between mobile and desktop

### 2. Platform Abstraction
- Shared packages are platform-agnostic (no React Native or Electron dependencies)
- Platform-specific implementations in apps

### 3. Dependency Direction
```
Apps (mobile, desktop)
  ↓ depends on
Shared Packages (types, logic, services, state)
  ↓ depends on
External Libraries (axios, @reduxjs/toolkit, etc.)
```

Shared packages should NEVER import from apps.

---

## 🚀 Development Workflow

### Before Writing Code

1. **Check Shared Packages First**
   ```bash
   # Use slash command
   /check-shared <functionality>

   # Or search manually
   grep -r "functionName" packages/
   ```

2. **If Exists: Import It**
   ```typescript
   import { existingFunction } from '@bgos/shared-logic';
   ```

3. **If Doesn't Exist: Add to Shared**
   - Create in appropriate shared package
   - Export from package's `index.ts`
   - Import in your app

### Working on Multiple Platforms

**Option 1: Single Terminal (Recommended)**
- Use scope-specific prompts: `/mobile`, `/desktop`, `/shared`
- Lower cost, focused context

**Option 2: Multiple Terminals**
- Terminal 1: Desktop (`cd` to root)
- Terminal 2: Mobile (`cd apps/mobile`)
- Terminal 3: Shared (`cd packages/`)
- Higher cost, better isolation

**Option 3: Hybrid (Best for Mixed Work)**
- Primary terminal for feature work
- Task tool agents for investigations
- Slash commands for checks

---

## 📚 Related Documentation

- `DEVELOPMENT_GUIDELINES.md` - Coding best practices
- `SHARED_PACKAGES_REFERENCE.md` - Quick reference of all shared code
- `MIGRATION_PLAN.md` - Phased desktop migration roadmap
- `.claude/prompts/context.md` - Claude-specific reminders

---

## 🔍 Quick Reference: Finding Code

### Where to Look

| What You Need | Where It Lives |
|---------------|----------------|
| Types (Chat, Assistant, User) | `packages/shared-types/src/` |
| Utilities (colors, dates, avatars) | `packages/shared-logic/src/utils/` |
| API calls | `packages/shared-services/src/api/` |
| State management | `packages/shared-state/src/slices/` |
| Mobile components | `apps/mobile/src/components/` |
| Desktop components | `src/components/` |

### Search Commands

```bash
# Find a type
grep -r "interface Chat" packages/shared-types/

# Find a utility
grep -r "function getInitials" packages/shared-logic/

# Find an API service
grep -r "fetchAssistants" packages/shared-services/

# Find a Redux action
grep -r "addMessage" packages/shared-state/
```

---

## 🏁 Summary

**Current State:**
- ✅ Shared packages are well-structured
- ✅ Mobile uses shared packages correctly
- ⚠️ Desktop has duplication (migration pending)

**Golden Rules:**
1. Always import from `@bgos/shared-*` packages
2. Check before creating (it probably exists)
3. When in doubt, search shared packages first

**Next Steps:**
- Follow `DEVELOPMENT_GUIDELINES.md` for daily development
- Use `/check-shared` before writing new code
- Gradually migrate desktop (see `MIGRATION_PLAN.md`)
