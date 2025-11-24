# Desktop Development Context

> **Scope:** Electron desktop app development

---

## 🎯 You Are Now in Desktop Mode

**Working Directory:** `src/` (at root level)
**Platform:** Electron (Windows, macOS, Linux)
**Status:** ⚠️ Desktop has technical debt - local copies of shared code exist but should NOT be used

---

## ⚠️ CRITICAL: Desktop Technical Debt

### The Situation

Desktop currently has **LOCAL COPIES** of code that should use shared packages:

```
src/types/model/           → Should use @bgos/shared-types
src/utils/avatarUtils.ts   → Should use @bgos/shared-logic
src/utils/colors.ts        → Should use @bgos/shared-logic
src/utils/dateFormatter.ts → Should use @bgos/shared-logic
src/slices/                → Should use @bgos/shared-state
```

### Your Mission

**For ALL new code: Use shared packages (ignore local copies)**

```typescript
// ❌ WRONG - Don't use local copies (even though they exist)
import { Chat } from '../types/model/Chat';
import { getInitials } from '../utils/avatarUtils';
import assistantReducer from '../slices/AssistantSlice';

// ✅ CORRECT - Always use shared packages
import { Chat } from '@bgos/shared-types';
import { getInitials } from '@bgos/shared-logic';
import { AssistantActions } from '@bgos/shared-state';
```

### Migration Status

**Current:** Local copies exist and are used (legacy)
**Goal:** Gradually migrate to shared packages
**Your Role:** Use shared packages for all new code, migrate old code opportunistically

See `MIGRATION_PLAN.md` for detailed migration roadmap.

---

## 🖥️ Desktop-Specific Guidelines

### What Belongs in Desktop

**Platform-Specific Code:**
- Electron IPC communication (main ↔ renderer)
- File system operations (reading/writing files)
- Window management (minimize, maximize, close)
- Native menus and keyboard shortcuts
- Desktop-specific UI components
- Electron-specific services (DatabaseSyncService, etc.)

**Example:**
```typescript
// src/services/DatabaseSyncService.ts
import { ipcRenderer } from 'electron';
import { AssistantActions } from '@bgos/shared-state';
import { store } from '../config/store';

export class DatabaseSyncService {
  async syncWithLocalDatabase() {
    // Electron IPC - desktop-specific
    const data = await ipcRenderer.invoke('sync-database');

    // Update shared state
    store.dispatch(AssistantActions.setAssistants(data.assistants));
  }
}
```

---

### What Does NOT Belong in Desktop

**Use Shared Packages For:**
- Business logic → `@bgos/shared-logic`
- API calls → `@bgos/shared-services`
- Types → `@bgos/shared-types`
- State management → `@bgos/shared-state`

**Example:**
```typescript
// ❌ DON'T create these in desktop (even though they exist!)
// src/types/model/Chat.ts
// src/utils/dateFormatter.ts
// src/services/ChatCRUDService.ts (should use shared)

// ✅ DO import from shared
import type { Chat } from '@bgos/shared-types';
import { getRelativeTime } from '@bgos/shared-logic';
import { renameChat } from '@bgos/shared-services';
```

---

## 🏗️ Desktop App Structure

```
src/ (Desktop at root level)
├── components/            # React components (60+ files)
│   ├── ChatArea.tsx      # Main chat interface
│   ├── Sidebar.tsx       # Sidebar component
│   ├── MessageItem.tsx   # Message display
│   ├── icons/            # Icon components
│   └── voiceAgent/       # Voice-related components
├── config/               # Configuration files
│   └── storeConfig.ts    # Redux store setup (needs migration)
├── hooks/                # Custom React hooks
├── services/             # Desktop-specific services
│   ├── AssistantCRUDService.ts    # ⚠️ Should use @bgos/shared-services
│   ├── ChatCRUDService.ts         # ⚠️ Should use @bgos/shared-services
│   ├── DatabaseSyncService.ts     # ✅ Desktop-specific (Electron IPC)
│   ├── elevenLabsEventService.ts  # Could be shared
│   └── FetchUnreadMessagesService.ts
├── slices/               # ⚠️ DUPLICATED - Should use @bgos/shared-state
│   ├── AssistantSlice.ts
│   ├── ChatSlice.ts      # Has enhancements not in shared
│   ├── ChatHistorySlice.ts
│   ├── UISlice.ts
│   └── UserSlice.ts
├── types/                # ⚠️ DUPLICATED - Should use @bgos/shared-types
│   └── model/
│       ├── Assistant.ts
│       ├── Chat.ts
│       ├── ChatHistory.ts
│       ├── Notification.ts
│       └── User.ts
├── utils/                # ⚠️ DUPLICATED - Should use @bgos/shared-logic
│   ├── avatarUtils.ts       # Exact duplicate
│   ├── colors.ts            # Has bugs fixed in shared
│   ├── dateFormatter.ts     # Exact duplicate
│   ├── ArticleParser.ts     # Could be shared
│   ├── audioUtils.ts        # Could be shared
│   ├── Base64Converter.ts   # Should be shared
│   ├── CodeHighlighter.ts   # Could be shared
│   ├── exportChatHistory.ts # Desktop-specific
│   ├── imageUtils.ts        # Could be shared
│   └── selectors.ts         # Desktop-specific
├── main.ts               # Electron main process
└── renderer.tsx          # Electron renderer process entry
```

---

## 🔄 Correct Desktop Pattern (What to Do)

### Pattern 1: Store Configuration

**Current (Wrong):**
```typescript
// src/config/storeConfig.ts
import assistantReducer from '../slices/AssistantSlice';  // Local copy
import chatReducer from '../slices/ChatSlice';            // Local copy
import voiceReducer from '@bgos/shared-state/dist/slices/voiceSlice';  // Shared!

export const store = configureStore({
  reducer: {
    assistants: assistantReducer,
    chats: chatReducer,
    voice: voiceReducer,
  }
});
```

**Correct (Use This):**
```typescript
// src/config/storeConfig.ts
import { createStore } from '@bgos/shared-state';

// Use shared store factory (like mobile does)
export const store = createStore();
```

---

### Pattern 2: Component with State

**Current (Wrong):**
```typescript
// src/components/ChatArea.tsx
import { Chat } from '../types/model/Chat';  // Local copy
import { getInitials } from '../utils/avatarUtils';  // Local copy
import { COLORS } from '../utils/colors';  // Local copy

// Component code...
```

**Correct (Use This):**
```typescript
// src/components/ChatArea.tsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

// Shared imports
import type { Chat, ChatHistory } from '@bgos/shared-types';
import { getInitials, COLORS, getRelativeTime } from '@bgos/shared-logic';
import { ChatActions, type RootState } from '@bgos/shared-state';

export function ChatArea() {
  const dispatch = useDispatch();
  const activeChat = useSelector((state: RootState) => state.chats.activeChat);
  const messages = useSelector((state: RootState) =>
    state.chatHistory.messages[activeChat?.id]
  );

  // Desktop UI code...
  return (
    <div className="chat-area">
      {messages.map(msg => (
        <div key={msg.id}>
          {msg.content}
          <span>{getRelativeTime(msg.timestamp)}</span>
        </div>
      ))}
    </div>
  );
}
```

---

### Pattern 3: Desktop Service Using Shared

**Current (Wrong):**
```typescript
// src/services/ChatCRUDService.ts
export async function renameChat(userId: string, chatId: string, newTitle: string) {
  const url = `https://n8n-test.brandgrowthos.ai/webhook/.../chats/${userId}/${chatId}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: newTitle }),
  });
  return response.json();
}
```

**Correct (Use This):**
```typescript
// Just use the shared service directly in components
import { renameChat } from '@bgos/shared-services';

// In component:
await renameChat(userId, chatId, newTitle);

// Or if you need desktop-specific wrapper:
// src/services/DesktopChatService.ts
import { renameChat as sharedRenameChat } from '@bgos/shared-services';
import { ipcRenderer } from 'electron';

export async function renameChat(userId: string, chatId: string, newTitle: string) {
  // Use shared service
  await sharedRenameChat(userId, chatId, newTitle);

  // Desktop-specific: Update local database via IPC
  await ipcRenderer.invoke('update-local-chat', { chatId, title: newTitle });
}
```

---

### Pattern 4: Electron IPC Service (Desktop-Specific)

```typescript
// src/services/DatabaseSyncService.ts (This is correct - desktop-specific)
import { ipcRenderer } from 'electron';
import { AssistantActions, ChatActions } from '@bgos/shared-state';
import { store } from '../config/store';
import type { Assistant, Chat } from '@bgos/shared-types';

export class DatabaseSyncService {
  async syncWithLocalDatabase() {
    try {
      // Electron-specific IPC call
      const data = await ipcRenderer.invoke('sync-database');

      // Update shared state with synced data
      store.dispatch(AssistantActions.setAssistants(data.assistants));
      store.dispatch(ChatActions.setChats(data.chats));

      return data;
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }

  async saveToLocalDatabase(data: { assistants: Assistant[]; chats: Chat[] }) {
    // Electron-specific IPC call
    await ipcRenderer.invoke('save-database', data);
  }
}
```

---

## 🔧 Desktop-Specific Use Cases

### File System Operations

```typescript
// src/services/FileService.ts
import { ipcRenderer } from 'electron';
import type { Chat } from '@bgos/shared-types';

export class FileService {
  async exportChatHistory(chat: Chat, messages: ChatHistory[]) {
    // Desktop-specific: Use Electron's file system
    const result = await ipcRenderer.invoke('export-chat', {
      chat,
      messages,
    });
    return result;
  }

  async importChatHistory() {
    const result = await ipcRenderer.invoke('import-chat');
    return result;
  }
}
```

### Window Management

```typescript
// src/services/WindowService.ts
import { ipcRenderer } from 'electron';

export class WindowService {
  minimize() {
    ipcRenderer.send('window-minimize');
  }

  maximize() {
    ipcRenderer.send('window-maximize');
  }

  close() {
    ipcRenderer.send('window-close');
  }
}
```

---

## 🚨 Desktop-Specific Gotchas

### Issue #1: ChatSlice Has Local Enhancements

**Problem:** Desktop's `src/slices/ChatSlice.ts` has additional timestamp estimation logic not in shared version.

**Solution:**
1. For NEW code: Use `@bgos/shared-state`
2. If you need the enhancement: Contribute it to shared package
3. Don't add more features to local copy

**Example:**
```typescript
// ❌ Don't enhance local copy
// src/slices/ChatSlice.ts - Adding new features here

// ✅ Enhance shared package instead
// packages/shared-state/src/slices/ChatSlice.ts - Add features here
// Then import from shared
```

---

### Issue #2: Colors Utility Has Bugs

**Problem:** Desktop's `src/utils/colors.ts` uses deprecated `.substr()` and doesn't handle `rgb()` format.

**Solution:** Use `@bgos/shared-logic` which has the fixed version.

```typescript
// ❌ Desktop's buggy version
import { getColorWithOpacity } from '../utils/colors';

// ✅ Shared's fixed version
import { getColorWithOpacity } from '@bgos/shared-logic';
```

---

### Issue #3: API Services Use fetch() Instead of Axios

**Problem:** Desktop services use `fetch()` directly instead of shared Axios client.

**Solution:** Use `@bgos/shared-services` or the `apiClient` from shared.

```typescript
// ❌ Desktop's fetch approach
const response = await fetch(url, { method: 'DELETE' });

// ✅ Shared's Axios approach
import { deleteChat } from '@bgos/shared-services';
await deleteChat(userId, chatId);

// Or use shared client for custom calls
import { apiClient } from '@bgos/shared-services';
const response = await apiClient.delete(`/chats/${userId}/${chatId}`);
```

---

## 🧪 Testing Desktop Code

### Unit Tests

```typescript
// src/components/ChatArea.test.tsx
import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from '@bgos/shared-state';
import { ChatArea } from './ChatArea';

describe('ChatArea', () => {
  it('renders messages correctly', () => {
    const store = createStore();
    const { getByText } = render(
      <Provider store={store}>
        <ChatArea />
      </Provider>
    );
    // Test assertions...
  });
});
```

---

## 🚀 Running Desktop App

### Development

```bash
# Navigate to root (desktop is at root level)
cd E:\01 Claude Code Projects\BGOS_Kc

# Install dependencies
npm install

# Start development server
npm run dev

# Or start Electron directly
npm run electron:dev
```

### Building

```bash
# Build for Windows
npm run build:win

# Build for macOS
npm run build:mac

# Build for Linux
npm run build:linux
```

---

## ✅ Desktop Development Checklist

**Before creating new code:**
- [ ] Is this Electron IPC? → Create in `src/services/`
- [ ] Is this file system operation? → Create in `src/services/`
- [ ] Is this window management? → Create in `src/services/`
- [ ] Is this business logic? → Add to `@bgos/shared-logic`
- [ ] Is this a type? → Add to `@bgos/shared-types`
- [ ] Is this an API call? → Use `@bgos/shared-services`
- [ ] Is this state management? → Use `@bgos/shared-state`

**Before importing:**
- [ ] Using `@bgos/shared-*` for shared code?
- [ ] NOT importing from local `types/model/`?
- [ ] NOT importing from local `utils/` for shared utilities?
- [ ] NOT importing from local `slices/`?

**When touching old code:**
- [ ] Can I migrate this to use shared packages?
- [ ] Should I refactor while I'm here?
- [ ] See `MIGRATION_PLAN.md` for guidance

---

## 🔄 Migration Workflow

### When You Touch Old Code

1. **Identify duplication**
   ```typescript
   // Found this in old code
   import { Chat } from '../types/model/Chat';
   ```

2. **Check if shared equivalent exists**
   ```bash
   grep -r "interface Chat" packages/shared-types/
   # Found it!
   ```

3. **Replace with shared import**
   ```typescript
   import type { Chat } from '@bgos/shared-types';
   ```

4. **Test the change**
   ```bash
   npm run test
   npm run dev  # Verify app still works
   ```

5. **Commit the migration**
   ```bash
   git add .
   git commit -m "refactor: migrate Chat type import to shared package"
   ```

---

## 🎯 Desktop Key Reminders

1. **Local copies exist** - But don't use them for new code
2. **Use shared packages** - For types, logic, services, state
3. **Desktop-specific only** - IPC, file system, window management
4. **Migrate opportunistically** - Fix old code when you touch it
5. **Mobile is the model** - Follow mobile's shared package usage

---

## 📚 Desktop-Specific Resources

**Electron:**
- IPC: https://www.electronjs.org/docs/latest/api/ipc-renderer
- File System: Use Node.js `fs` module in main process
- Window: https://www.electronjs.org/docs/latest/api/browser-window

**Shared Code:**
- Types: `@bgos/shared-types`
- Logic: `@bgos/shared-logic`
- Services: `@bgos/shared-services`
- State: `@bgos/shared-state`

**Migration:**
- See `MIGRATION_PLAN.md` for detailed roadmap
- See `DEVELOPMENT_GUIDELINES.md` for best practices

---

## 🆘 Common Desktop Issues

### Issue: "Cannot find module '@bgos/shared-types'"
```bash
# Build shared packages
cd packages/shared-types
npm run build
cd ../..
npm install
```

### Issue: "Store not working after migration"
```typescript
// Make sure you're using the shared store factory
import { createStore } from '@bgos/shared-state';
export const store = createStore();
```

### Issue: "Types don't match between desktop and mobile"
```bash
# Both should use shared types - no discrepancies
# If types are mismatched, you're importing from wrong place
# Always use @bgos/shared-types
```

---

## 📝 Summary

**Desktop Development = Electron-Specific Code + Shared Packages**

- ✅ Use Electron for IPC, file system, windows
- ✅ Use shared packages for logic/state/types/API
- ✅ Migrate local copies to shared opportunistically
- ✅ Follow mobile's example (it's the gold standard)
- ❌ Don't use local copies in `src/types/`, `src/utils/`, `src/slices/`
- ❌ Don't add features to local copies (add to shared instead)
- ❌ Don't duplicate code that belongs in shared

**You're in desktop mode. Focus on Electron-specific features and use shared packages for everything else!**

**Remember: Desktop has technical debt, but YOU can help fix it by using shared packages in all new code!**
