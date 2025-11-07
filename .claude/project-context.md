# AVA Assistant - Project Context for Claude Code

> This document provides essential context for Claude Code sessions working on this project. Read this file at the start of each session to understand the project structure, conventions, and recent changes.

## Project Overview

AVA Assistant is an Electron-based AI assistant application built with React, Redux, and TypeScript. It provides multiple AI assistants with chat functionality, user profile management, and comprehensive UI features.

## Recent Major Changes (Last Updated: November 3, 2025)

### Keyboard Shortcuts System (NEW)
- **Global Keyboard Shortcuts** (`src/hooks/useKeyboardShortcuts.ts`): Full keyboard navigation
  - **Ctrl/Cmd + K**: Focus search bar
  - **Ctrl/Cmd + N**: New chat (resets to blank chat)
  - **Ctrl/Cmd + ,**: Open Settings modal
  - **Ctrl/Cmd + Shift + H**: Open Chat History modal
  - **ESC**: Close any open modal (Settings, Chat History, etc.)
  - **Ctrl/Cmd + 1-9**: Quick switch to starred agents by index
  - Intelligent detection: Prevents shortcuts when typing in inputs
  - Cross-platform: Detects Cmd (Mac) vs Ctrl (Windows/Linux)

### Search & Filtering System (NEW)
- **Sidebar Search Bar** (`src/components/Sidebar.tsx`): Real-time agent/chat search
  - Claude-style minimalistic design with yellow (#FFD700) focus ring
  - Search icon (magnifying glass) and clear button (X)
  - Real-time filtering using `useMemo` for performance
  - Filters both agents (by name and subtitle) and chats (by title)
  - "No agents found" message when no results
  - Clears on ESC key when focused
  - Auto-focuses on Ctrl/Cmd + K shortcut

### Chat Export Utility (Foundation)
- **Export Utility** (`src/utils/exportChatHistory.ts`): Export chat conversations
  - Supports 3 formats: Markdown (.md), JSON (.json), Plain Text (.txt)
  - Includes complete metadata: chat title, agent name, export date, message count
  - Exports timestamps, sender labels, attachments, and special content
  - Browser-based download (no Electron changes needed)
  - Ready for UI integration (pending data fetching implementation)

### Settings & Profile System
- **Settings Modal** (`src/components/SettingsModal.tsx`): Full user profile management
  - Full name input with live avatar preview
  - Work role dropdown (Marketing, Engineering, HR, etc.)
  - Appearance settings (Dark theme active, Light coming soon)
  - Save/Cancel functionality with state rollback
  - Original value tracking for proper cancel behavior

### Chat History System
- **Chat History Modal** (`src/components/ChatHistoryModal.tsx`): Browse and manage all chats
  - Search functionality across chat titles
  - Bulk select and delete with confirmation dialog
  - "New Chat" button that properly resets state (shows blank chat, not a specific chat)
  - Reference: `E:\04 BGOS App\AVA-ASSISTANT-master\AVA-ASSISTANT-master\Reference Images\Chat history reference.png`

### Account Menu
- **Account Menu** (`src/components/AccountMenu.tsx`): User account dropdown
  - Settings (opens Settings modal)
  - Language (placeholder for future implementation)
  - Get help (placeholder)
  - Upgrade plan (placeholder)
  - Learn more (placeholder)
  - Log out (functional)
  - Smart positioning via `ContextMenuPortal`

### Smart Positioning System
- **Context Menu Portal** (`src/components/ContextMenuPortal.tsx`): Universal positioning system
  - Automatically detects available space above/below trigger element
  - Positions menus to avoid viewport overflow
  - Handles z-index stacking correctly
  - Used by: AccountMenu, AssistantItemMenu, ChatItemMenu

### Star/Favorite System
- Users can star/favorite both assistants and chats
- Starred items tracked in Redux (`UserSlice`)
- Icons: `StarIcon.tsx` and `StarFilledIcon.tsx`
- Models updated: `Assistant.ts` and `Chat.ts` have `starred: boolean` property

## UI Design System & Mandatory Patterns

### Brand Colors
- **Primary Action Color**: `#FFD700` (Yellow/Gold)
  - Used for: focused states, primary buttons, selected items, active indicators
  - **REPLACED ALL BLUE** (`#5a9fd4`) throughout the application
  - Examples:
    - Settings modal Save button
    - Dark theme active indicator
    - Dropdown focus borders
    - Hover states for primary actions

### Mandatory UI Patterns

#### 1. Hover Effects (MANDATORY EVERYWHERE)
**CRITICAL**: All interactive list elements MUST have hover effects. This is a mandatory pattern.

```tsx
// Correct pattern:
const [hoveredItem, setHoveredItem] = useState<string | null>(null);

<button
  onMouseEnter={() => setHoveredItem('item-id')}
  onMouseLeave={() => setHoveredItem(null)}
  style={{
    backgroundColor: hoveredItem === 'item-id' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
    color: hoveredItem === 'item-id' ? '#ffffff' : '#a7a7a5'
  }}
>
```

**Where to apply:**
- All list items (chats, assistants, menu items)
- All clickable elements in sidebars
- All dropdown options
- All interactive cards

#### 2. Claude-Style Scrollbars
Use thin, elegant scrollbars throughout:

```css
.custom-scrollable::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollable::-webkit-scrollbar-track {
    background: transparent;
    margin: 8px 0;
}

.custom-scrollable::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    transition: background 0.2s ease;
}

.custom-scrollable::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
}

.custom-scrollable::-webkit-scrollbar-thumb:active {
    background: rgba(255, 255, 255, 0.3);
}

/* Firefox */
.custom-scrollable {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}
```

#### 3. Framer Motion Animations
Use for smooth interactions:

```tsx
import { motion } from 'framer-motion';

<motion.div
    whileHover={{ x: 2 }}
    whileTap={{ scale: 0.95 }}
    transition={{ duration: 0.2 }}
>
```

**Where to apply:**
- User profile section
- New chat buttons
- Primary action buttons

#### 4. Modal Shake Animation
When user clicks backdrop, modal should shake (not close):

```tsx
const [isShaking, setIsShaking] = useState(false);

const handleBackdropClick = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
};

// In style:
animation: isShaking ? 'shake 0.5s' : 'none'
```

## Backend Architecture (NEW - November 4, 2025)

### Current Stack
- **Workflow Engine**: n8n (https://n8n-test.brandgrowthos.ai)
- **Database**: PostgreSQL 14+ (5 tables: AA_USER, AA_ASSISTANT, AA_CHAT, AA_CHAT_HISTORY, AA_SCHEDULED_TASKS)
- **AI Integration**: OpenAI GPT-4.1-mini (for chat title generation)
- **Communication**: HTTPS webhooks (14 endpoints)
- **Authentication**: Currently hardcoded (needs JWT implementation)

### Data Flow
```
User Action (Frontend)
  → Service Layer (TypeScript)
    → Electron IPC (window.electronAPI)
      → Main Process (Node.js)
        → n8n Webhook
          → PostgreSQL Query
            → Response back through chain
```

### Backend Documentation

**Comprehensive documentation now available in `.claude/` folder**:
- **DATABASE_SCHEMA.md** - Complete PostgreSQL schema, all tables, relationships
- **API_ENDPOINTS.md** - All 14 webhook endpoints with request/response examples
- **N8N_WORKFLOWS.md** - Workflow logic, scheduled tasks, data transformations
- **BACKEND_ARCHITECTURE.md** - System architecture, tech stack, performance
- **SUPABASE_MIGRATION_PLAN.md** - Future migration roadmap to Supabase
- **AGENT_BACKEND_SPECIALIST.md** - "BG OS Back-end developer" specialist agent profile

**Team documentation**: `docs/BACKEND_DOCUMENTATION.md`

### Backend Services

All backend operations accessed via service layer:
```
src/services/
├── DatabaseSyncService.ts         # RTK Query API (main operations)
├── ChatCRUDService.ts             # Chat CRUD operations
├── AssistantCRUDService.ts        # Assistant CRUD operations
├── ChatHistoryCRUDService.ts      # Message operations
└── FetchUnreadMessagesService.ts  # Unread message polling
```

### Data Mapping (snake_case ↔ camelCase)

**Database** (PostgreSQL - snake_case):
```json
{ "user_id": 1, "avatar_url": "...", "s2s_token": "..." }
```

**Frontend** (TypeScript - camelCase):
```json
{ "userId": 1, "avatarUrl": "...", "s2sToken": "..." }
```

**Mapping**: `src/types/AssistantWebhookMap.ts` contains mapping functions

### Backend Specialist Agent

Use the "BG OS Back-end developer" specialist agent for backend tasks:
```
@backend-specialist, I need help with [database/API/workflow task]
```

**Agent Capabilities**:
- Database schema design and optimization
- API endpoint design
- n8n workflow development
- Supabase migration planning
- Performance tuning and query optimization

---

## Architecture & State Management

### Redux Slices

#### UserSlice (`src/slices/UserSlice.ts`)
```typescript
interface UserState {
  currentUser: {
    name: string;
    email: string;
    role: string;
    preferences: {
      starredAssistants: string[];
      starredChats: string[];
    }
  }
}
```

**Actions:**
- `updateUser({ name, role })` - Update user profile
- `toggleStarAssistant(assistantId)` - Toggle assistant favorite
- `toggleStarChat(chatId)` - Toggle chat favorite

#### ChatSlice (`src/slices/ChatSlice.ts`)
**Actions:**
- `pushChat(chat)` - Add new chat
- `removeChat(chatId)` - Delete chat
- `toggleStarChat(chatId)` - Toggle favorite

#### AssistantSlice (`src/slices/AssistantSlice.ts`)
**Actions:**
- `toggleStarAssistant(assistantId)` - Toggle favorite

### Key Components

#### Sidebar (`src/components/Sidebar.tsx`)
- Main navigation component
- Manages assistant list, chat list, user profile
- Handles New Chat button (calls `resetChatState()`)
- Integrates: ChatHistoryModal, AccountMenu, SettingsModal

#### Avatar System
**Utils:** `src/utils/avatarUtils.ts`
- `getInitials(fullName)` - Extract initials (e.g., "John Doe" → "JD")
- `getAvatarColor(name)` - Consistent color per name
- **IMPORTANT**: Avatars use FULL NAME, not email

## Common Patterns & Solutions

### Pattern: State Reset vs Navigation
```typescript
// WRONG: Creating new chat and navigating to it
const handleNewChat = () => {
  const newChat = { id: 'chat_123', ... };
  dispatch(pushChat(newChat));
  onSelectChat(newChat.id); // ❌ This navigates to specific chat
};

// CORRECT: Reset state to show blank chat
const handleNewChat = () => {
  resetChatState(); // ✅ This shows a blank new chat
  onClose();
};
```

### Pattern: Cancel with State Rollback
```typescript
// Track original values for cancel functionality
const [originalName, setOriginalName] = useState(currentUser?.name || '');
const [fullName, setFullName] = useState(currentUser?.name || '');

// On modal open, store original values
useEffect(() => {
  if (currentUser && isOpen) {
    setFullName(currentUser.name || '');
    setOriginalName(currentUser.name || '');
  }
}, [currentUser, isOpen]);

// Cancel reverts to original
const handleCancel = () => {
  setFullName(originalName);
  onClose();
};

// Save updates original values
const handleSave = () => {
  dispatch(updateUser({ name: fullName }));
  setOriginalName(fullName);
  onClose();
};
```

### Pattern: Smart Dropdown Positioning
Use `ContextMenuPortal` for all dropdowns:

```typescript
<ContextMenuPortal
  isOpen={isOpen}
  triggerRef={triggerRef}
  onClose={onClose}
>
  <div className="menu-content">
    {/* menu items */}
  </div>
</ContextMenuPortal>
```

The portal automatically:
- Positions above if trigger is at bottom of screen
- Positions below if trigger is at top of screen
- Prevents viewport overflow
- Handles z-index correctly

## File Structure

```
src/
├── components/
│   ├── AccountMenu.tsx              # User account dropdown
│   ├── SettingsModal.tsx            # User settings modal (ESC handler)
│   ├── ChatHistoryModal.tsx         # Chat history browser (ESC handler)
│   ├── ContextMenuPortal.tsx        # Smart positioning system
│   ├── BulkDeleteConfirmDialog.tsx  # Bulk delete confirmation
│   ├── Sidebar.tsx                  # Main navigation (search bar, filtering)
│   ├── StarIcon.tsx                 # Outline star icon
│   └── StarFilledIcon.tsx           # Filled star icon
├── hooks/
│   └── useKeyboardShortcuts.ts      # Global keyboard shortcuts hook
├── slices/
│   ├── UserSlice.ts                 # User state & preferences
│   ├── ChatSlice.ts                 # Chat state
│   └── AssistantSlice.ts            # Assistant state
├── types/model/
│   ├── Chat.ts                      # Chat model (has starred property)
│   └── Assistant.ts                 # Assistant model (has starred property)
└── utils/
    ├── avatarUtils.ts               # Avatar generation utilities
    ├── dateFormatter.ts             # Date formatting utilities
    └── exportChatHistory.ts         # Chat export utility (Markdown, JSON, TXT)
```

## Development Workflow

### Git Workflow
- **Main branch**: `master`
- **Feature branches**: `feature/feature-name`
- **Workflow**: Feature branch → Push → Pull Request → Review → Merge

### Creating New Features
1. Work on `feature/improvements` branch (or create new feature branch)
2. Commit with descriptive messages
3. Push to GitHub
4. Create Pull Request for review

## Known Issues & Solutions

### Issue: New Chat button navigates to specific chat
**Solution**: Use `resetChatState()` instead of creating and navigating to new chat

### Issue: AccountMenu appears at wrong position
**Solution**: Use `ContextMenuPortal` with proper `triggerRef`

### Issue: Avatar shows email initial instead of full name
**Solution**: Use `getInitials(fullName)` not `email[0]`

### Issue: Hover effects not working
**Solution**: Use state-based hover (`useState`), not pure CSS

## Reference Images

Located in: `Reference Images/`
- Chat history reference.png - Chat History modal design
- Sidebar reference image.png - Sidebar design
- Screenshots for Settings modal

## Important Notes for Claude Code

1. **Always apply hover effects** to interactive lists
2. **Always use yellow (#FFD700)** for primary actions (not blue)
3. **Always use `ContextMenuPortal`** for dropdown menus
4. **Always use full name** for avatars (not email)
5. **Always include save/cancel** in settings modals with state rollback
6. **Always use Claude-style scrollbars** in scrollable areas
7. **Always use Framer Motion** for interactive elements
8. **Always add ESC key handlers** to modals and dialogs
9. **Always use `useMemo`** for real-time filtering operations
10. **Read this file** at the start of each session

### Keyboard Shortcuts Available
Users can navigate the app using:
- **Ctrl/Cmd + K**: Focus search
- **Ctrl/Cmd + N**: New chat
- **Ctrl/Cmd + ,**: Settings
- **Ctrl/Cmd + Shift + H**: Chat History
- **ESC**: Close modals
- **Ctrl/Cmd + 1-9**: Quick agent switch

## Contact & Attribution

All features authored by Kc with the help of Claude Code.

---

**Last Updated**: November 3, 2025
**Last Major Features**: Keyboard Shortcuts, Search & Filtering, Export Utility Foundation
