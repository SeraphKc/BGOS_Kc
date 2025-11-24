# Development Guidelines for BGOS_Kc

> **Purpose:** Prevent code duplication and ensure consistent use of shared packages across mobile and desktop apps.

---

## 🎯 Core Principles

### 1. Shared-First Development

**ALWAYS check shared packages before writing new code.**

```typescript
// ❌ BAD: Creating a new utility without checking
export function formatDate(date: Date): string {
  // Custom implementation...
}

// ✅ GOOD: First check if it exists in shared
import { getRelativeTime } from '@bgos/shared-logic';
const formatted = getRelativeTime(date);
```

### 2. Import from Shared Packages

**NEVER create local copies of shared code.**

```typescript
// ❌ WRONG - Local import
import { Chat } from '../types/model/Chat';
import { getInitials } from '../utils/avatarUtils';
import assistantReducer from '../slices/AssistantSlice';

// ✅ CORRECT - Shared package import
import { Chat } from '@bgos/shared-types';
import { getInitials } from '@bgos/shared-logic';
import { AssistantActions } from '@bgos/shared-state';
```

### 3. Single Source of Truth

Every piece of logic should exist in exactly ONE place.

| Type of Code | Location | Import From |
|-------------|----------|-------------|
| Types & Interfaces | `packages/shared-types/` | `@bgos/shared-types` |
| Utilities & Logic | `packages/shared-logic/` | `@bgos/shared-logic` |
| API Services | `packages/shared-services/` | `@bgos/shared-services` |
| State Management | `packages/shared-state/` | `@bgos/shared-state` |

---

## 🔍 Before Writing Code: The Checklist

### Step 1: Search Shared Packages

**Use the slash command:**
```bash
/check-shared <functionality>
```

**Or search manually:**
```bash
# Search for types
grep -r "interface Chat" packages/shared-types/

# Search for utilities
grep -r "function getInitials" packages/shared-logic/

# Search for services
grep -r "fetchAssistants" packages/shared-services/

# Search for state
grep -r "createSlice.*assistant" packages/shared-state/
```

### Step 2: If It Exists → Import It

```typescript
// Found in shared-logic? Import it!
import { getInitials, getAvatarColor } from '@bgos/shared-logic';

// Found in shared-services? Import it!
import { fetchAssistantsWithChats } from '@bgos/shared-services';

// Found in shared-state? Import actions!
import { ChatActions } from '@bgos/shared-state';
```

### Step 3: If It Doesn't Exist → Add to Shared

**Don't create it in your app - add it to shared packages first.**

```bash
# Navigate to appropriate shared package
cd packages/shared-logic

# Create the utility
# Edit src/utils/yourNewUtil.ts

# Export it from index.ts
# Add to src/index.ts

# Build the package
npm run build

# Now import in your app
```

---

## 📝 Common Scenarios & Solutions

### Scenario 1: Need a New Type

**❌ Wrong Approach:**
```typescript
// apps/mobile/src/types/Message.ts
export interface Message {
  id: string;
  content: string;
}
```

**✅ Correct Approach:**
```bash
# 1. Add to shared-types
cd packages/shared-types/src
# Create Message.ts

# 2. Export from index.ts
echo "export * from './Message';" >> index.ts

# 3. Build
npm run build

# 4. Import in your app
```

```typescript
// apps/mobile/src/components/MessageItem.tsx
import { Message } from '@bgos/shared-types';
```

---

### Scenario 2: Need a Utility Function

**❌ Wrong Approach:**
```typescript
// apps/mobile/src/utils/stringHelpers.ts
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
```

**✅ Correct Approach:**
```bash
# 1. Check if it exists
grep -r "capitalize" packages/shared-logic/

# 2. If not, add to shared-logic
cd packages/shared-logic/src/utils
# Add to existing stringUtils.ts or create new file

# 3. Export from index.ts

# 4. Build and import
```

---

### Scenario 3: Need an API Call

**❌ Wrong Approach:**
```typescript
// Desktop: src/services/ChatService.ts
export async function deleteChat(userId: string, chatId: string) {
  const response = await fetch(`${BASE_URL}/chats/${userId}/${chatId}`, {
    method: 'DELETE'
  });
  return response.json();
}
```

**✅ Correct Approach:**
```typescript
// Use existing service from shared-services
import { deleteChat } from '@bgos/shared-services';

// In your component/service
await deleteChat(userId, chatId);
```

**If the API doesn't exist in shared-services:**
```bash
# 1. Add to packages/shared-services/src/api/chatApi.ts
# 2. Export from index.ts
# 3. Build and use
```

---

### Scenario 4: Need State Management

**❌ Wrong Approach:**
```typescript
// Creating a local Redux slice
// src/slices/MyNewSlice.ts
const mySlice = createSlice({
  name: 'myFeature',
  initialState,
  reducers: { /* ... */ }
});
```

**✅ Correct Approach:**
```bash
# 1. Add to packages/shared-state/src/slices/
cd packages/shared-state/src/slices
# Create MyNewSlice.ts

# 2. Add to store.ts
# Update reducer configuration

# 3. Export from index.ts

# 4. Build
npm run build

# 5. Use in app
```

```typescript
import { MyFeatureActions } from '@bgos/shared-state';
dispatch(MyFeatureActions.doSomething());
```

---

## 🚨 Common Mistakes to Avoid

### Mistake 1: Duplicating Code Instead of Using Shared

**Problem:** Creating `apps/mobile/src/utils/avatarUtils.ts` when it exists in `@bgos/shared-logic`.

**Detection:**
```bash
# Use validate-imports command
/validate-imports

# Or grep for duplicates
find . -name "avatarUtils.ts"
```

**Fix:**
```typescript
// Delete local copy
// Import from shared
import { getInitials, getAvatarColor } from '@bgos/shared-logic';
```

---

### Mistake 2: Using Wrong Import Paths

**Problem:** Importing from desktop's local copy instead of shared package.

**Examples:**
```typescript
// ❌ WRONG
import { Chat } from '../types/model/Chat';
import { getInitials } from '../../utils/avatarUtils';
import assistantReducer from '../slices/AssistantSlice';

// ✅ CORRECT
import { Chat } from '@bgos/shared-types';
import { getInitials } from '@bgos/shared-logic';
import { AssistantActions } from '@bgos/shared-state';
```

**Prevention:**
- Use `/validate-imports` command before committing
- Set up ESLint rule to enforce `@bgos/*` imports
- Review PRs for import paths

---

### Mistake 3: Inconsistent Changes

**Problem:** Updating logic in one place but forgetting the shared package.

**Example:**
```typescript
// Desktop: Updated local copy
// src/utils/dateFormatter.ts - Added new function
export function formatChatDate(date: Date): string { /* ... */ }

// But forgot to update shared package!
// Mobile doesn't have access to new function
```

**Prevention:**
- Always update shared packages first
- Then update apps to use the new functionality
- Never update local copies (they should be deleted)

---

### Mistake 4: Not Knowing What's Available

**Problem:** Reimplementing functionality that already exists.

**Solution:**
- Keep `SHARED_PACKAGES_REFERENCE.md` open while coding
- Use `/check-shared` command frequently
- Search before creating

**Quick Reference:**
```bash
# Check for utilities
ls packages/shared-logic/src/utils/

# Check for types
ls packages/shared-types/src/

# Check for services
ls packages/shared-services/src/api/

# Check for state slices
ls packages/shared-state/src/slices/
```

---

## ✅ Pre-Commit Checklist

Before committing code, verify:

- [ ] All imports use `@bgos/shared-*` packages (no local type/util imports)
- [ ] No duplicated code (checked shared packages first)
- [ ] New utilities/types added to shared packages (not local files)
- [ ] No hardcoded values (URLs, tokens, etc.)
- [ ] State management uses `@bgos/shared-state`
- [ ] API calls use `@bgos/shared-services`
- [ ] Ran `/validate-imports` command
- [ ] Tested on target platform (mobile or desktop)

---

## 🔧 Platform-Specific Guidelines

### Mobile Development (`apps/mobile/`)

**What Belongs Here:**
- React Native components (`<View>`, `<Text>`, `<FlatList>`)
- Navigation configuration (React Navigation)
- AsyncStorage utilities
- Native module integration
- Platform-specific UI (SafeAreaView, StatusBar)

**What Belongs in Shared:**
- Business logic
- API calls
- Types
- State management
- Utilities (date formatting, string manipulation, etc.)

**Example Mobile Component:**
```typescript
// apps/mobile/src/screens/chat/ChatScreen.tsx
import React from 'react';
import { View, Text, FlatList } from 'react-native';  // Mobile-specific
import { useSelector, useDispatch } from 'react-redux';
import { ChatActions, type RootState } from '@bgos/shared-state';  // Shared
import { getRelativeTime } from '@bgos/shared-logic';  // Shared
import type { Chat } from '@bgos/shared-types';  // Shared

export function ChatScreen() {
  const chats = useSelector((state: RootState) => state.chats.list);
  // Mobile UI implementation...
}
```

---

### Desktop Development (`src/`)

**What Belongs Here:**
- Electron-specific components
- IPC communication with main process
- File system operations
- Window management
- Desktop-specific UI

**What Belongs in Shared:**
- Business logic
- API calls
- Types
- State management
- Utilities

**⚠️ Desktop Migration Note:**
Desktop currently has local copies of shared code. These are documented as technical debt and will be migrated gradually. **Do not add more local copies** - use shared packages for all new code.

**Example Desktop Component:**
```typescript
// src/components/ChatArea.tsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ChatActions, type RootState } from '@bgos/shared-state';  // Shared
import { getRelativeTime } from '@bgos/shared-logic';  // Shared
import type { Chat } from '@bgos/shared-types';  // Shared

export function ChatArea() {
  const chats = useSelector((state: RootState) => state.chats.list);
  // Desktop UI implementation...
}
```

---

### Shared Package Development (`packages/`)

**When to Add Code Here:**
- Used by 2+ platforms (mobile and desktop)
- Platform-agnostic (no React Native or Electron dependencies)
- Pure business logic
- API integration
- State management
- Type definitions

**Package Structure:**
```typescript
// packages/shared-logic/src/utils/myUtil.ts
export function myUtility(input: string): string {
  // Pure function - no platform dependencies
  return input.toUpperCase();
}

// packages/shared-logic/src/index.ts
export * from './utils/myUtil';
```

**Building After Changes:**
```bash
cd packages/shared-logic
npm run build

# Or build all packages
cd ../..
npm run build --workspace=packages/*
```

---

## 🎨 Code Style Guidelines

### Imports Organization

**Order:**
1. External libraries
2. Shared packages (`@bgos/*`)
3. Local relative imports

```typescript
// 1. External libraries
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

// 2. Shared packages
import { Chat, Assistant } from '@bgos/shared-types';
import { getInitials, COLORS } from '@bgos/shared-logic';
import { fetchAssistantsWithChats } from '@bgos/shared-services';
import { ChatActions, type RootState } from '@bgos/shared-state';

// 3. Local imports
import { MessageBubble } from './MessageBubble';
import { VoiceRecorder } from '../voice/VoiceRecorder';
```

### Type Imports

**Use `type` keyword for type-only imports:**
```typescript
// ✅ Good
import type { Chat, Assistant } from '@bgos/shared-types';
import type { RootState } from '@bgos/shared-state';

// ❌ Avoid (unless importing values too)
import { Chat, Assistant } from '@bgos/shared-types';
```

### Barrel Exports

**Always export from `index.ts` in shared packages:**
```typescript
// packages/shared-logic/src/index.ts
export * from './utils/avatarUtils';
export * from './utils/colors';
export * from './utils/dateFormatter';

// Enables clean imports
import { getInitials, COLORS, getRelativeTime } from '@bgos/shared-logic';
```

---

## 🧪 Testing Guidelines

### Unit Tests for Shared Packages

**Test everything in shared packages:**
```typescript
// packages/shared-logic/src/utils/avatarUtils.test.ts
import { getInitials, getAvatarColor } from './avatarUtils';

describe('avatarUtils', () => {
  describe('getInitials', () => {
    it('should extract initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD');
    });
  });
});
```

### Integration Tests for Apps

**Test platform-specific integrations:**
```typescript
// apps/mobile/src/services/AuthService.test.ts
import { login } from './AuthService';
import { UserActions } from '@bgos/shared-state';

describe('AuthService', () => {
  it('should dispatch UserActions after successful login', async () => {
    // Test mobile-specific auth flow with shared state
  });
});
```

---

## 📚 Documentation Standards

### JSDoc for Shared Code

**Document all public APIs in shared packages:**
```typescript
/**
 * Generates initials from a full name.
 * @param name - Full name (e.g., "John Doe")
 * @returns Uppercase initials (e.g., "JD")
 * @example
 * ```typescript
 * const initials = getInitials("John Doe"); // "JD"
 * ```
 */
export function getInitials(name: string): string {
  // Implementation...
}
```

### README for Each Package

**Every shared package should have a README:**
```markdown
# @bgos/shared-logic

Business logic and utility functions shared across mobile and desktop apps.

## Installation

This package is part of the BGOS_Kc monorepo.

## Usage

import { getInitials, COLORS } from '@bgos/shared-logic';

## API Reference

### `getInitials(name: string): string`
Extracts initials from a full name...
```

---

## 🚀 Workflow Tips

### Use Slash Commands

```bash
# Check if functionality exists in shared packages
/check-shared date formatting

# Validate imports in current file
/validate-imports

# Set context for platform-specific work
/mobile   # For mobile development
/desktop  # For desktop development
/shared   # For shared package development
```

### Use Task Agents for Research

When exploring codebase or investigating duplicates:
```bash
# Let an agent search for you
"Find all instances of avatarUtils across the codebase"
"Check if there's a date formatting utility in shared packages"
```

### Keep Reference Docs Open

- `ARCHITECTURE.md` - Monorepo structure
- `SHARED_PACKAGES_REFERENCE.md` - Quick lookup of shared code
- `MIGRATION_PLAN.md` - Track migration progress

---

## 🆘 Troubleshooting

### Issue: "Cannot find module '@bgos/shared-types'"

**Cause:** Shared packages not built or not installed.

**Solution:**
```bash
# Install dependencies
npm install

# Build shared packages
npm run build --workspace=packages/*

# Or build specific package
cd packages/shared-types
npm run build
```

---

### Issue: "Types are out of sync between packages"

**Cause:** Changes made to shared package but not rebuilt.

**Solution:**
```bash
# Rebuild shared packages
cd packages/shared-types
npm run build

# Restart your dev server
npm run start
```

---

### Issue: "Import path works locally but fails in production"

**Cause:** Using relative import instead of package import.

**Solution:**
```typescript
// ❌ Wrong - relative path
import { Chat } from '../../../packages/shared-types/src/Chat';

// ✅ Correct - package import
import { Chat } from '@bgos/shared-types';
```

---

## 📖 Summary

**Remember:**
1. **Search First** - Check shared packages before creating
2. **Import from Shared** - Always use `@bgos/shared-*` imports
3. **Add to Shared** - New utilities/types belong in shared packages
4. **Validate Before Commit** - Use `/validate-imports` command
5. **Single Source of Truth** - Every piece of logic exists in ONE place

**When in Doubt:**
- Use `/check-shared` command
- Review `SHARED_PACKAGES_REFERENCE.md`
- Check mobile app for examples (it uses shared correctly)

**Questions?**
- See `ARCHITECTURE.md` for structure
- See `MIGRATION_PLAN.md` for desktop migration status
- Ask Claude to search shared packages
