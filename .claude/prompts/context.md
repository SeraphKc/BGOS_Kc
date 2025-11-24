# CRITICAL CONTEXT: BGOS_Kc Monorepo

> **This context is ALWAYS active. Read this BEFORE every response.**

---

## 🚨 GOLDEN RULES (NEVER VIOLATE)

### Rule #1: ALWAYS Use Shared Packages

```typescript
// ✅ ALWAYS DO THIS
import { Chat, Assistant } from '@bgos/shared-types';
import { getInitials, COLORS } from '@bgos/shared-logic';
import { fetchAssistantsWithChats } from '@bgos/shared-services';
import { ChatActions } from '@bgos/shared-state';

// ❌ NEVER DO THIS
import { Chat } from '../types/model/Chat';
import { getInitials } from '../utils/avatarUtils';
import assistantReducer from '../slices/AssistantSlice';
```

### Rule #2: Check Before Creating

**BEFORE writing ANY utility, type, or service:**
1. Search `packages/shared-*` directories
2. Check `SHARED_PACKAGES_REFERENCE.md`
3. If it exists → import it
4. If it doesn't → add it to shared packages first

### Rule #3: No Duplication

**NEVER create local copies of:**
- Types (use `@bgos/shared-types`)
- Utilities (use `@bgos/shared-logic`)
- API services (use `@bgos/shared-services`)
- Redux slices (use `@bgos/shared-state`)

---

## 📦 Available Shared Packages

| Package | Contains | Import Pattern |
|---------|----------|----------------|
| `@bgos/shared-types` | Chat, Assistant, User, ChatHistory, Notification | `import type { Chat } from '@bgos/shared-types'` |
| `@bgos/shared-logic` | getInitials, COLORS, getRelativeTime, avatarUtils, dateFormatter | `import { getInitials } from '@bgos/shared-logic'` |
| `@bgos/shared-services` | fetchAssistants, renameChat, deleteChat, syncDatabase, apiClient | `import { fetchAssistants } from '@bgos/shared-services'` |
| `@bgos/shared-state` | All Redux slices, store factory, actions | `import { ChatActions } from '@bgos/shared-state'` |

---

## 🧠 What You Need to Know

### Project Structure

```
BGOS_Kc/
├── packages/          # SHARED CODE - Always use these
│   ├── shared-types/     # Types
│   ├── shared-logic/     # Utilities
│   ├── shared-services/  # API
│   └── shared-state/     # Redux
├── apps/mobile/       # React Native (Android/iOS) - Uses shared correctly ✅
└── src/               # Electron desktop - Has duplication ⚠️
```

### Mobile App Status: ✅ CORRECT
Mobile correctly imports all shared packages. **Use mobile as reference.**

### Desktop App Status: ⚠️ TECHNICAL DEBT
Desktop has LOCAL COPIES of code that should use shared packages:
- `src/types/model/*` → Should use `@bgos/shared-types`
- `src/utils/avatarUtils.ts` → Should use `@bgos/shared-logic`
- `src/utils/colors.ts` → Should use `@bgos/shared-logic`
- `src/utils/dateFormatter.ts` → Should use `@bgos/shared-logic`
- `src/slices/*` → Should use `@bgos/shared-state`

**For NEW code:** Always use shared packages (ignore local copies)
**For EXISTING code:** Gradually migrate to shared (see MIGRATION_PLAN.md)

---

## 🎯 Your Workflow

### BEFORE Writing ANY Code

```
1. Is this a type?
   → Check packages/shared-types/src/

2. Is this a utility function?
   → Check packages/shared-logic/src/utils/

3. Is this an API call?
   → Check packages/shared-services/src/api/

4. Is this state management?
   → Check packages/shared-state/src/slices/

5. Found it? Import it!
6. Didn't find it? Add to shared, then import!
```

### When User Asks for New Feature

```
1. Analyze what's needed
2. Check shared packages for existing code
3. Plan to use/extend shared code
4. Only create NEW shared code if necessary
5. NEVER create local copies
```

---

## 🚫 Common Mistakes to AVOID

### Mistake #1: Creating Local Copies
```typescript
// ❌ WRONG - Creating new file
// apps/mobile/src/utils/stringHelpers.ts
export function capitalize(str: string) { /* ... */ }

// ✅ CORRECT - Add to shared, then import
// packages/shared-logic/src/utils/stringHelpers.ts
export function capitalize(str: string) { /* ... */ }
// Then: import { capitalize } from '@bgos/shared-logic';
```

### Mistake #2: Wrong Import Paths
```typescript
// ❌ WRONG
import { Chat } from '../types/model/Chat';

// ✅ CORRECT
import { Chat } from '@bgos/shared-types';
```

### Mistake #3: Reimplementing Existing Code
```typescript
// ❌ WRONG - Reimplementing existing utility
function getUserInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

// ✅ CORRECT - Using existing utility
import { getInitials } from '@bgos/shared-logic';
const initials = getInitials(name);
```

### Mistake #4: Creating Redux Slices Locally
```typescript
// ❌ WRONG - Creating new slice in app
// src/slices/MySlice.ts
const mySlice = createSlice({ /* ... */ });

// ✅ CORRECT - Add to shared-state
// packages/shared-state/src/slices/MySlice.ts
// Then: import { MyActions } from '@bgos/shared-state';
```

---

## 📚 Quick Reference

### Commonly Used Utilities

```typescript
// Date formatting
import { getRelativeTime } from '@bgos/shared-logic';
getRelativeTime(new Date()); // "Just now", "2 hours ago", etc.

// Avatar utilities
import { getInitials, getAvatarColor } from '@bgos/shared-logic';
getInitials('John Doe');  // "JD"
getAvatarColor('John Doe'); // "#7C6F5D"

// Colors
import { COLORS } from '@bgos/shared-logic';
const primary = COLORS.PRIMARY;

// API calls
import { fetchAssistantsWithChats, renameChat } from '@bgos/shared-services';

// State management
import { ChatActions, AssistantActions } from '@bgos/shared-state';
dispatch(ChatActions.addMessage(message));
```

### Commonly Used Types

```typescript
import type {
  Chat,
  Assistant,
  User,
  ChatHistory,
  Sender,
  MessageStatus
} from '@bgos/shared-types';
```

---

## 🔍 How to Search for Existing Code

### Method 1: Use Slash Command
```bash
/check-shared <functionality>
```

### Method 2: Direct Search
```bash
# Search for types
grep -r "interface Chat" packages/shared-types/

# Search for utilities
grep -r "getInitials" packages/shared-logic/

# Search for services
grep -r "fetchAssistants" packages/shared-services/
```

### Method 3: Check Reference
Open `SHARED_PACKAGES_REFERENCE.md` and search for functionality.

---

## 🎨 Code Style Requirements

### Import Order
```typescript
// 1. External libraries
import React from 'react';
import { useSelector } from 'react-redux';

// 2. Shared packages (grouped by package)
import type { Chat, Assistant } from '@bgos/shared-types';
import { getInitials, COLORS } from '@bgos/shared-logic';
import { fetchAssistants } from '@bgos/shared-services';
import { ChatActions } from '@bgos/shared-state';

// 3. Local imports
import { MessageBubble } from './MessageBubble';
```

### Type Imports
```typescript
// ✅ Use 'type' keyword for type-only imports
import type { Chat } from '@bgos/shared-types';

// ❌ Avoid regular imports for types
import { Chat } from '@bgos/shared-types';
```

---

## 🏗️ Platform-Specific Rules

### Mobile (`apps/mobile/`)

**What belongs here:**
- React Native components (`<View>`, `<Text>`, `<FlatList>`)
- Navigation (React Navigation setup)
- AsyncStorage utilities
- Native module integration
- Platform-specific UI

**What belongs in shared:**
- Business logic
- API calls
- Types
- State management
- Utilities

### Desktop (`src/`)

**What belongs here:**
- Electron-specific code (IPC, file system)
- Desktop UI components
- Window management
- Desktop-specific features

**What belongs in shared:**
- Business logic
- API calls
- Types
- State management
- Utilities

**⚠️ Desktop Migration Note:**
When working on desktop, ALWAYS use shared packages for new code, even though local copies exist. The local copies are technical debt being migrated gradually.

---

## 🔄 State Management Pattern

### Store Setup

**Mobile (Correct):**
```typescript
import { createStore } from '@bgos/shared-state';
const store = createStore();
```

**Desktop (Should migrate to):**
```typescript
// Instead of configuring store manually with local slices
// Use the shared store factory
import { createStore } from '@bgos/shared-state';
const store = createStore();
```

### Using Actions

```typescript
import { useDispatch, useSelector } from 'react-redux';
import { ChatActions, type RootState } from '@bgos/shared-state';

// In component
const dispatch = useDispatch();
const chats = useSelector((state: RootState) => state.chats.list);

// Dispatch actions
dispatch(ChatActions.addChat(newChat));
dispatch(ChatActions.setActiveChat(chat));
```

---

## 📋 Pre-Response Checklist

**Before EVERY response, ask yourself:**

- [ ] Am I about to create a type? → Check `@bgos/shared-types` first
- [ ] Am I about to create a utility? → Check `@bgos/shared-logic` first
- [ ] Am I about to make an API call? → Check `@bgos/shared-services` first
- [ ] Am I about to create state logic? → Check `@bgos/shared-state` first
- [ ] Am I importing from shared packages? → Use `@bgos/shared-*` pattern
- [ ] Am I working on desktop? → Use shared packages, ignore local copies
- [ ] Am I duplicating code? → If yes, STOP and refactor to shared

---

## 🆘 When in Doubt

1. **Search shared packages first**
   ```bash
   grep -r "functionalityName" packages/
   ```

2. **Check reference docs**
   - `SHARED_PACKAGES_REFERENCE.md` - Complete API reference
   - `ARCHITECTURE.md` - Project structure
   - `DEVELOPMENT_GUIDELINES.md` - Best practices

3. **Look at mobile app**
   Mobile uses shared packages correctly - use as example

4. **Ask for clarification**
   If unsure, ask user: "Should this be added to shared packages?"

---

## 💡 Pro Tips

### Tip #1: Search Before Creating
80% of utilities you need probably already exist in shared packages.

### Tip #2: Mobile is Your Friend
When unsure how to use shared packages, check how mobile does it.

### Tip #3: Desktop Local Copies Are Technical Debt
If you see `src/types/model/Chat.ts` or `src/utils/avatarUtils.ts` in desktop, these are OLD copies. Don't use them. Use `@bgos/shared-*` imports instead.

### Tip #4: Add, Don't Duplicate
If something doesn't exist in shared, add it there first, then use it.

---

## 🎯 Success Criteria

**You're doing it right when:**
- All imports use `@bgos/shared-*` pattern
- No new files in `apps/mobile/src/types/` or `apps/mobile/src/utils/` that duplicate shared
- No new files in `src/types/` or `src/utils/` that duplicate shared
- API calls use `@bgos/shared-services`
- State management uses `@bgos/shared-state`
- Types use `@bgos/shared-types`

**You're doing it wrong when:**
- Creating `utils/stringHelpers.ts` in app directory
- Importing from `../types/model/Chat` instead of `@bgos/shared-types`
- Creating Redux slices in app directories
- Duplicating code that exists in shared packages

---

## 📝 Summary

**Remember:**
1. Shared packages ALWAYS come first
2. Check before creating (use `/check-shared`)
3. Import from `@bgos/shared-*` (never local paths for shared code)
4. Mobile does it correctly (use as reference)
5. Desktop has technical debt (use shared anyway)

**When user asks for new code:**
1. Search shared packages
2. If exists → import it
3. If doesn't exist → add to shared, then import
4. NEVER create local copies

**This context applies to EVERY interaction!**
