# Shared Packages Quick Reference

> **Purpose:** Fast lookup for all shared code. Check this BEFORE creating any new utility, type, or service.

---

## 📦 Package Overview

| Package | Purpose | Import From |
|---------|---------|-------------|
| `@bgos/shared-types` | TypeScript types & interfaces | `import { Chat } from '@bgos/shared-types'` |
| `@bgos/shared-logic` | Utilities & business logic | `import { getInitials } from '@bgos/shared-logic'` |
| `@bgos/shared-services` | API services (n8n) | `import { fetchAssistants } from '@bgos/shared-services'` |
| `@bgos/shared-state` | Redux state management | `import { ChatActions } from '@bgos/shared-state'` |

---

## 🎨 `@bgos/shared-types`

**Location:** `packages/shared-types/src/`

### Available Types

#### `Assistant.ts`
```typescript
interface Assistant {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Usage:**
```typescript
import type { Assistant } from '@bgos/shared-types';

const assistant: Assistant = {
  id: '1',
  name: 'My Assistant',
  // ...
};
```

---

#### `Chat.ts`
```typescript
interface Chat {
  id: string;
  assistantId: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
}
```

**Usage:**
```typescript
import type { Chat } from '@bgos/shared-types';

const chat: Chat = {
  id: '1',
  assistantId: 'asst_1',
  userId: 'user_1',
  title: 'New Conversation',
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

---

#### `ChatHistory.ts`
```typescript
enum Sender {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

enum MessageStatus {
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed',
  RECEIVED = 'received'
}

interface FileInfo {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

interface ChatHistory {
  id: string;
  chatId: string;
  sender: Sender;
  content: string;
  timestamp: Date;
  status: MessageStatus;
  files?: FileInfo[];
}
```

**Usage:**
```typescript
import type { ChatHistory, Sender, MessageStatus, FileInfo } from '@bgos/shared-types';

const message: ChatHistory = {
  id: 'msg_1',
  chatId: 'chat_1',
  sender: Sender.USER,
  content: 'Hello!',
  timestamp: new Date(),
  status: MessageStatus.SENT,
};
```

---

#### `User.ts`
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Usage:**
```typescript
import type { User } from '@bgos/shared-types';

const user: User = {
  id: 'user_1',
  email: 'user@example.com',
  name: 'John Doe',
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

---

#### `Notification.ts`
```typescript
interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
}
```

**Usage:**
```typescript
import type { Notification } from '@bgos/shared-types';

const notification: Notification = {
  id: 'notif_1',
  userId: 'user_1',
  title: 'New Message',
  message: 'You have a new message',
  type: 'info',
  read: false,
  createdAt: new Date(),
};
```

---

## 🧰 `@bgos/shared-logic`

**Location:** `packages/shared-logic/src/utils/`

### Avatar Utilities (`avatarUtils.ts`)

#### `getInitials(name: string): string`
Extracts initials from a full name.

```typescript
import { getInitials } from '@bgos/shared-logic';

getInitials('John Doe');        // 'JD'
getInitials('Alice');           // 'A'
getInitials('Bob Smith Jr.');   // 'BS'
```

---

#### `getAvatarColor(name: string): string`
Returns a consistent color for a given name (for avatar backgrounds).

```typescript
import { getAvatarColor } from '@bgos/shared-logic';

getAvatarColor('John Doe');     // '#7C6F5D' (consistent for this name)
getAvatarColor('Alice Smith');  // '#6B8E7F' (different color)
```

---

#### `avatarColors: string[]`
Array of predefined avatar colors.

```typescript
import { avatarColors } from '@bgos/shared-logic';

console.log(avatarColors);
// ['#7C6F5D', '#6B8E7F', '#8B5E83', ...]
```

---

### Color Utilities (`colors.ts`)

#### `COLORS`
Primary color palette used throughout the app.

```typescript
import { COLORS } from '@bgos/shared-logic';

const primary = COLORS.PRIMARY;           // Main brand color
const secondary = COLORS.SECONDARY;       // Secondary brand color
const background = COLORS.BACKGROUND;     // Background color
const text = COLORS.TEXT;                 // Text color
const border = COLORS.BORDER;             // Border color
const error = COLORS.ERROR;               // Error color
const success = COLORS.SUCCESS;           // Success color
const warning = COLORS.WARNING;           // Warning color
```

---

#### `WHITE_4_OPACITIES`
White color with different opacity levels.

```typescript
import { WHITE_4_OPACITIES } from '@bgos/shared-logic';

const opacity10 = WHITE_4_OPACITIES.OPACITY_10;   // 'rgba(255, 255, 255, 0.1)'
const opacity20 = WHITE_4_OPACITIES.OPACITY_20;   // 'rgba(255, 255, 255, 0.2)'
const opacity30 = WHITE_4_OPACITIES.OPACITY_30;   // 'rgba(255, 255, 255, 0.3)'
const opacity40 = WHITE_4_OPACITIES.OPACITY_40;   // 'rgba(255, 255, 255, 0.4)'
```

---

#### `SEMANTIC_COLORS`
Semantic color mappings for common UI states.

```typescript
import { SEMANTIC_COLORS } from '@bgos/shared-logic';

const info = SEMANTIC_COLORS.INFO;
const success = SEMANTIC_COLORS.SUCCESS;
const warning = SEMANTIC_COLORS.WARNING;
const error = SEMANTIC_COLORS.ERROR;
```

---

#### `getColorWithOpacity(color: string, opacity: number): string`
Converts a color to RGBA format with specified opacity.

```typescript
import { getColorWithOpacity } from '@bgos/shared-logic';

// Works with hex colors
getColorWithOpacity('#FF0000', 0.5);    // 'rgba(255, 0, 0, 0.5)'

// Works with rgb colors
getColorWithOpacity('rgb(255, 0, 0)', 0.5);  // 'rgba(255, 0, 0, 0.5)'
```

---

### Date Utilities (`dateFormatter.ts`)

#### `getRelativeTime(date: Date): string`
Returns human-readable relative time (e.g., "2 hours ago", "Just now").

```typescript
import { getRelativeTime } from '@bgos/shared-logic';

const now = new Date();
const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

getRelativeTime(now);           // 'Just now'
getRelativeTime(twoHoursAgo);   // '2 hours ago'
```

**Output formats:**
- "Just now" (< 1 minute)
- "X minutes ago" (< 1 hour)
- "X hours ago" (< 24 hours)
- "Yesterday" (yesterday)
- "X days ago" (< 7 days)
- "MM/DD/YYYY" (older)

---

#### `getRelativeTimeFromChat(chat: Chat): string`
Gets relative time from a chat's lastMessageAt or updatedAt timestamp.

```typescript
import { getRelativeTimeFromChat } from '@bgos/shared-logic';
import type { Chat } from '@bgos/shared-types';

const chat: Chat = {
  id: '1',
  // ...
  lastMessageAt: new Date(Date.now() - 3600000),  // 1 hour ago
};

getRelativeTimeFromChat(chat);  // '1 hour ago'
```

---

#### `compareChatsByDate(a: Chat, b: Chat): number`
Comparator function for sorting chats by most recent activity.

```typescript
import { compareChatsByDate } from '@bgos/shared-logic';

const chats = [...allChats].sort(compareChatsByDate);
// Chats sorted with most recent first
```

---

## 🌐 `@bgos/shared-services`

**Location:** `packages/shared-services/src/api/`

### API Client (`client.ts`)

#### `apiClient`
Configured Axios instance for API calls.

```typescript
import { apiClient } from '@bgos/shared-services';

// Use for custom API calls
const response = await apiClient.get('/custom-endpoint');
const data = await apiClient.post('/endpoint', { data });
```

**Configuration:**
- Base URL: `https://n8n-test.brandgrowthos.ai/webhook/b6f845bc-2d9c-43b2-8412-c81871c8bf89`
- Headers: `Content-Type: application/json`

---

### Assistant API (`assistantApi.ts`)

#### `fetchAssistantsWithChats(userId: string)`
Fetches all assistants for a user along with their associated chats.

```typescript
import { fetchAssistantsWithChats } from '@bgos/shared-services';

const assistants = await fetchAssistantsWithChats('user_123');
// Returns: Assistant[] with nested chats
```

---

#### `createAssistant(userId: string, data: CreateAssistantData)`
Creates a new assistant.

```typescript
import { createAssistant } from '@bgos/shared-services';

const newAssistant = await createAssistant('user_123', {
  name: 'My Assistant',
  description: 'Helpful assistant',
});
```

---

#### `updateAssistant(userId: string, assistantId: string, data: UpdateAssistantData)`
Updates an existing assistant.

```typescript
import { updateAssistant } from '@bgos/shared-services';

await updateAssistant('user_123', 'asst_1', {
  name: 'Updated Name',
});
```

---

#### `deleteAssistant(userId: string, assistantId: string)`
Deletes an assistant.

```typescript
import { deleteAssistant } from '@bgos/shared-services';

await deleteAssistant('user_123', 'asst_1');
```

---

### Chat API (`chatApi.ts`)

#### `renameChat(userId: string, chatId: string, newTitle: string)`
Renames a chat.

```typescript
import { renameChat } from '@bgos/shared-services';

await renameChat('user_123', 'chat_1', 'New Chat Title');
```

---

#### `deleteChat(userId: string, chatId: string)`
Deletes a chat.

```typescript
import { deleteChat } from '@bgos/shared-services';

await deleteChat('user_123', 'chat_1');
```

---

#### `fetchChatName(userId: string, chatId: string)`
Fetches the name/title of a specific chat.

```typescript
import { fetchChatName } from '@bgos/shared-services';

const chatName = await fetchChatName('user_123', 'chat_1');
// Returns: string
```

---

#### `assignScheduledChat(userId: string, chatId: string, scheduledChatId: string)`
Assigns a scheduled chat to a regular chat.

```typescript
import { assignScheduledChat } from '@bgos/shared-services';

await assignScheduledChat('user_123', 'chat_1', 'scheduled_1');
```

---

### Database API (`databaseApi.ts`)

#### `syncDatabase(userId: string)`
Syncs the database for a user (fetches all data from backend).

```typescript
import { syncDatabase } from '@bgos/shared-services';

const syncResult = await syncDatabase('user_123');
// Returns: { assistants: Assistant[], chats: Chat[], messages: ChatHistory[] }
```

---

### Mappers (`mappers.ts`)

Data transformation utilities for mapping between API responses and app types.

```typescript
import { mapApiAssistantToAssistant, mapApiChatToChat } from '@bgos/shared-services';

// Map API response to app types
const assistant = mapApiAssistantToAssistant(apiResponse);
const chat = mapApiChatToChat(apiResponse);
```

---

## 🗄️ `@bgos/shared-state`

**Location:** `packages/shared-state/src/`

### Store Factory (`store.ts`)

#### `createStore()`
Creates a configured Redux store with all slices.

```typescript
import { createStore } from '@bgos/shared-state';

const store = createStore();

// Use with React Redux
import { Provider } from 'react-redux';

<Provider store={store}>
  <App />
</Provider>
```

---

### Assistant Slice (`slices/AssistantSlice.ts`)

#### State Shape
```typescript
{
  list: Assistant[];           // All assistants
  selected: Assistant | null;  // Currently selected assistant
  loading: boolean;            // Loading state
  error: string | null;        // Error message
}
```

#### Actions

```typescript
import { AssistantActions } from '@bgos/shared-state';

// Set assistants list
dispatch(AssistantActions.setAssistants(assistants));

// Add a new assistant
dispatch(AssistantActions.addAssistant(newAssistant));

// Update an assistant
dispatch(AssistantActions.updateAssistant({ id: 'asst_1', changes: { name: 'New Name' } }));

// Delete an assistant
dispatch(AssistantActions.deleteAssistant('asst_1'));

// Select an assistant
dispatch(AssistantActions.selectAssistant(assistant));

// Clear selection
dispatch(AssistantActions.clearSelection());

// Set loading state
dispatch(AssistantActions.setLoading(true));

// Set error
dispatch(AssistantActions.setError('Error message'));
```

#### Selectors

```typescript
import type { RootState } from '@bgos/shared-state';

const assistants = useSelector((state: RootState) => state.assistants.list);
const selected = useSelector((state: RootState) => state.assistants.selected);
const loading = useSelector((state: RootState) => state.assistants.loading);
const error = useSelector((state: RootState) => state.assistants.error);
```

---

### Chat Slice (`slices/ChatSlice.ts`)

#### State Shape
```typescript
{
  list: Chat[];              // All chats
  activeChat: Chat | null;   // Currently active chat
  loading: boolean;          // Loading state
  error: string | null;      // Error message
}
```

#### Actions

```typescript
import { ChatActions } from '@bgos/shared-state';

// Set chats list
dispatch(ChatActions.setChats(chats));

// Add a new chat
dispatch(ChatActions.addChat(newChat));

// Update a chat
dispatch(ChatActions.updateChat({ id: 'chat_1', changes: { title: 'New Title' } }));

// Delete a chat
dispatch(ChatActions.deleteChat('chat_1'));

// Set active chat
dispatch(ChatActions.setActiveChat(chat));

// Clear active chat
dispatch(ChatActions.clearActiveChat());

// Set loading state
dispatch(ChatActions.setLoading(true));

// Set error
dispatch(ChatActions.setError('Error message'));
```

#### Selectors

```typescript
import type { RootState } from '@bgos/shared-state';

const chats = useSelector((state: RootState) => state.chats.list);
const activeChat = useSelector((state: RootState) => state.chats.activeChat);
const loading = useSelector((state: RootState) => state.chats.loading);
const error = useSelector((state: RootState) => state.chats.error);
```

---

### Chat History Slice (`slices/ChatHistorySlice.ts`)

#### State Shape
```typescript
{
  messages: { [chatId: string]: ChatHistory[] };  // Messages grouped by chat
  sending: boolean;                                // Sending state
  error: string | null;                            // Error message
}
```

#### Actions

```typescript
import { ChatHistoryActions } from '@bgos/shared-state';

// Add a message to a chat
dispatch(ChatHistoryActions.addMessage({ chatId: 'chat_1', message }));

// Set all messages for a chat
dispatch(ChatHistoryActions.setMessages({ chatId: 'chat_1', messages }));

// Update a message
dispatch(ChatHistoryActions.updateMessage({
  chatId: 'chat_1',
  messageId: 'msg_1',
  changes: { status: MessageStatus.SENT }
}));

// Delete a message
dispatch(ChatHistoryActions.deleteMessage({ chatId: 'chat_1', messageId: 'msg_1' }));

// Clear messages for a chat
dispatch(ChatHistoryActions.clearMessages('chat_1'));

// Set sending state
dispatch(ChatHistoryActions.setSending(true));

// Set error
dispatch(ChatHistoryActions.setError('Error message'));
```

#### Selectors

```typescript
import type { RootState } from '@bgos/shared-state';

const allMessages = useSelector((state: RootState) => state.chatHistory.messages);
const chatMessages = useSelector((state: RootState) => state.chatHistory.messages['chat_1']);
const sending = useSelector((state: RootState) => state.chatHistory.sending);
const error = useSelector((state: RootState) => state.chatHistory.error);
```

---

### User Slice (`slices/UserSlice.ts`)

#### State Shape
```typescript
{
  currentUser: User | null;  // Logged-in user
  authenticated: boolean;    // Authentication status
  loading: boolean;          // Loading state
  error: string | null;      // Error message
}
```

#### Actions

```typescript
import { UserActions } from '@bgos/shared-state';

// Set current user (login)
dispatch(UserActions.setUser(user));

// Clear user (logout)
dispatch(UserActions.clearUser());

// Update user profile
dispatch(UserActions.updateUser({ name: 'New Name' }));

// Set loading state
dispatch(UserActions.setLoading(true));

// Set error
dispatch(UserActions.setError('Error message'));
```

#### Selectors

```typescript
import type { RootState } from '@bgos/shared-state';

const currentUser = useSelector((state: RootState) => state.user.currentUser);
const authenticated = useSelector((state: RootState) => state.user.authenticated);
const loading = useSelector((state: RootState) => state.user.loading);
const error = useSelector((state: RootState) => state.user.error);
```

---

### UI Slice (`slices/UISlice.ts`)

#### State Shape
```typescript
{
  sidebarOpen: boolean;         // Sidebar visibility
  modalOpen: string | null;     // Active modal ID
  theme: 'light' | 'dark';      // App theme
}
```

#### Actions

```typescript
import { UIActions } from '@bgos/shared-state';

// Toggle sidebar
dispatch(UIActions.toggleSidebar());

// Open sidebar
dispatch(UIActions.openSidebar());

// Close sidebar
dispatch(UIActions.closeSidebar());

// Open modal
dispatch(UIActions.openModal('settings'));

// Close modal
dispatch(UIActions.closeModal());

// Set theme
dispatch(UIActions.setTheme('dark'));
```

#### Selectors

```typescript
import type { RootState } from '@bgos/shared-state';

const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);
const modalOpen = useSelector((state: RootState) => state.ui.modalOpen);
const theme = useSelector((state: RootState) => state.ui.theme);
```

---

### Voice Slice (`slices/voiceSlice.ts`)

#### State Shape
```typescript
{
  isRecording: boolean;      // Recording status
  isPlaying: boolean;        // Playback status
  audioUrl: string | null;   // Current audio URL
  error: string | null;      // Error message
}
```

#### Actions

```typescript
import { VoiceActions } from '@bgos/shared-state';

// Start recording
dispatch(VoiceActions.startRecording());

// Stop recording
dispatch(VoiceActions.stopRecording());

// Start playback
dispatch(VoiceActions.startPlayback(audioUrl));

// Stop playback
dispatch(VoiceActions.stopPlayback());

// Set error
dispatch(VoiceActions.setError('Error message'));

// Clear error
dispatch(VoiceActions.clearError());
```

#### Selectors

```typescript
import type { RootState } from '@bgos/shared-state';

const isRecording = useSelector((state: RootState) => state.voice.isRecording);
const isPlaying = useSelector((state: RootState) => state.voice.isPlaying);
const audioUrl = useSelector((state: RootState) => state.voice.audioUrl);
const error = useSelector((state: RootState) => state.voice.error);
```

---

## 🔍 Quick Search Tips

### Find by Functionality

**Need to...**
- Format dates? → `getRelativeTime` from `@bgos/shared-logic`
- Get initials? → `getInitials` from `@bgos/shared-logic`
- Fetch assistants? → `fetchAssistantsWithChats` from `@bgos/shared-services`
- Manage chat state? → `ChatActions` from `@bgos/shared-state`
- Type a message? → `ChatHistory` from `@bgos/shared-types`
- Get colors? → `COLORS` from `@bgos/shared-logic`

### Search by Package

```bash
# Search types
ls packages/shared-types/src/

# Search utilities
ls packages/shared-logic/src/utils/

# Search services
ls packages/shared-services/src/api/

# Search state slices
ls packages/shared-state/src/slices/
```

---

## 📚 Import Examples

### Common Import Patterns

```typescript
// Types
import type { Chat, Assistant, User, ChatHistory } from '@bgos/shared-types';

// Utilities
import { getInitials, COLORS, getRelativeTime } from '@bgos/shared-logic';

// Services
import { fetchAssistantsWithChats, renameChat } from '@bgos/shared-services';

// State
import { ChatActions, AssistantActions, type RootState } from '@bgos/shared-state';
import { createStore } from '@bgos/shared-state';

// Mixed
import type { Chat } from '@bgos/shared-types';
import { getRelativeTime } from '@bgos/shared-logic';
import { ChatActions } from '@bgos/shared-state';
```

---

## ✅ Before Creating New Code

**Checklist:**
1. [ ] Searched this reference doc
2. [ ] Ran `/check-shared <functionality>`
3. [ ] Grepped shared packages: `grep -r "myFunction" packages/`
4. [ ] Checked if similar utility exists with different name

**If found:** Import and use it
**If not found:** Add to appropriate shared package

---

## 🆘 Still Can't Find It?

```bash
# Search all shared packages
grep -r "functionName" packages/

# List all exports
cat packages/shared-logic/src/index.ts
cat packages/shared-types/src/index.ts
cat packages/shared-services/src/index.ts
cat packages/shared-state/src/index.ts

# Ask Claude
"Search shared packages for date formatting utilities"
"What utilities exist in @bgos/shared-logic?"
```

---

## 📝 Summary

**Total Shared Code:**
- **5 Types** (Assistant, Chat, ChatHistory, User, Notification)
- **11 Utilities** (avatar, color, date functions)
- **10+ API Services** (assistant, chat, database operations)
- **6 State Slices** (assistant, chat, chatHistory, user, ui, voice)

**Remember:**
- Types → `@bgos/shared-types`
- Utilities → `@bgos/shared-logic`
- API → `@bgos/shared-services`
- State → `@bgos/shared-state`

**Always check this reference before creating new code!**
