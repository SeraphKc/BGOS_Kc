# Future Improvements & Functionalities

Last Updated: November 4, 2025

## Removed Features (Preserved for Future)

### Search Bar for Agents and Chats
**Status:** Removed November 4, 2025
**Reason:** Simplifying sidebar UI, deemed overbearing for initial release
**Code Location:** Commented filtering logic in `src/components/Sidebar.tsx` lines 93-94, 107-137

**What Was Removed:**
- Real-time search bar UI in sidebar
- Filtering logic for agents (by name and subtitle)
- Filtering logic for chats (by title)
- "No agents found" empty state message
- Keyboard shortcut handler (Ctrl/Cmd + K) - currently no-op in `src/renderer.tsx` line 254-256

**Technical Details:**
- Filtering logic is preserved in commented code with TODO markers
- Used `useMemo` for performance-optimized real-time filtering
- Yellow (#FFD700) focus ring styling (consistent with brand)
- Search icon (magnifying glass) and clear button (X) UI components
- State management: `searchQuery` string state for input tracking

**Files Modified:**
- `src/components/Sidebar.tsx` - Search UI and filtering logic commented out
- `src/renderer.tsx` - searchBarRef removed, keyboard shortcut made no-op

**Notes for Re-implementation:**
- The filtering logic works and is ready to be uncommented
- Consider implementing as a modal (similar to Chat History) instead of inline sidebar component
- Could be part of an "Agent Management" modal with additional features:
  - Search all agents
  - Bulk select and delete
  - Organize/categorize agents
  - Star/favorite management
  - Agent creation and editing

---

## Planned Features

### 1. Agent Management Modal
**Priority:** Medium
**Description:** Clickable "Agents" header or button opens modal similar to Chat History

**Proposed Features:**
- Search all agents by name, subtitle, or description
- Bulk select and delete agents
- Organize/categorize agents into folders or tags
- Quick actions: duplicate, edit, archive
- Star/favorite management with drag-to-reorder
- View agent statistics (total chats, last used, etc.)
- Import/export agents (JSON format)

**Design Inspiration:**
- Follow existing Chat History modal patterns
- Use same modal styling and animations
- Consistent with yellow (#FFD700) branding for primary actions

**Technical Considerations:**
- Reuse BulkDeleteConfirmDialog component
- Implement similar search functionality as commented code
- Add new Redux actions for bulk operations
- Consider performance with large numbers of agents

---

### 2. Export Chat History (Pending UI Integration)
**Priority:** High
**Status:** Utility function completed, needs UI integration
**Code Location:** `src/utils/exportChatHistory.ts`

**Completed:**
- Export utility function with 3 formats support:
  - Markdown (.md)
  - JSON (.json)
  - Plain Text (.txt)
- Includes complete metadata: chat title, agent name, export date, message count
- Exports timestamps, sender labels, attachments, and special content
- Browser-based download (no Electron changes needed)

**Pending:**
- UI button/menu item in Chat History modal
- UI button in individual chat view
- Data fetching implementation to pass full chat data to utility
- Format selection dropdown or menu

**Implementation Plan:**
1. Add "Export" button to ChatItemMenu component
2. Add "Export All" button to Chat History modal header
3. Add format selection modal/dropdown (Markdown/JSON/Text)
4. Fetch complete chat data including all messages
5. Call `exportChatHistory()` utility with selected format
6. Show success notification

---

### 3. Light Theme
**Priority:** Low
**Status:** Placeholder in Settings modal
**Code Location:** `src/components/SettingsModal.tsx` lines 362-390

**Current State:**
- "Coming Soon" badge displayed in Settings
- Option is disabled and grayed out
- Dark theme is active and fully functional

**Implementation Requirements:**
- Design complete light theme color palette
- Update all components with theme-aware styling
- Create theme toggle in UserSlice
- Update CSS variables or styled-components system
- Test all modals, menus, and components in light mode
- Ensure accessibility (contrast ratios, readability)

---

### 4. Enhanced Keyboard Shortcuts
**Priority:** Low
**Status:** Foundation exists, could be expanded

**Current Shortcuts:**
- Ctrl/Cmd + K: Focus search (currently no-op, was for search bar)
- Ctrl/Cmd + N: New chat
- Ctrl/Cmd + ,: Open Settings
- Ctrl/Cmd + Shift + H: Open Chat History
- ESC: Close modals
- Ctrl/Cmd + 1-9: Quick switch to starred agents

**Potential Additions:**
- Ctrl/Cmd + /: Show all keyboard shortcuts (help modal)
- Ctrl/Cmd + E: Export current chat
- Ctrl/Cmd + F: Search in current chat (find in messages)
- Ctrl/Cmd + D: Delete current chat
- Ctrl/Cmd + R: Rename current chat
- Ctrl/Cmd + B: Toggle sidebar
- Ctrl/Cmd + Shift + K: Toggle right sidebar (artifacts)
- Arrow keys: Navigate through message history
- Ctrl/Cmd + Enter: Send message (alternative to Enter)

---

## Backend Improvements (NEW - November 4, 2025)

### 5. JWT Authentication Implementation
**Priority:** High
**Status:** Planned
**Depends on:** Backend documentation (completed)

**Current State:**
- Authentication is hardcoded (`kc@gmail.com` / `123`)
- No real user management
- No session tracking
- Security vulnerability (public webhooks)

**Implementation Requirements:**
1. **Phase 1: n8n Workflow Endpoints**
   - POST `/auth/login` - Validate credentials, return JWT
   - POST `/auth/logout` - Invalidate session
   - POST `/auth/refresh` - Refresh access token
   - GET `/users/me` - Get current user profile
   - PATCH `/users/me` - Update user profile

2. **Phase 2: Database Changes**
   - Add `password_hash` column to AA_USER (bcrypt)
   - Create AA_USER_SESSIONS table for refresh tokens
   - Add user preferences columns (theme, language, notifications)

3. **Phase 3: Frontend Integration**
   - Create AuthService.ts with login/logout/refresh functions
   - Store JWT in localStorage (or secure storage)
   - Add Authorization header to all requests
   - Implement auto-refresh logic for expired tokens
   - Update LoginForm.tsx to call real auth endpoint

4. **Phase 4: Middleware**
   - Add JWT verification to all n8n webhook nodes
   - Return 401 Unauthorized for invalid/missing tokens
   - Extract userId from JWT for database queries

**Security Benefits:**
- Proper user authentication
- Session management
- Token-based authorization
- Protection against unauthorized access

---

### 6. Cloud Storage Migration (Base64 → URLs)
**Priority:** High
**Status:** Planned
**Current Issue:** Files stored as base64 in database (inefficient)

**Problems with Current Approach:**
- Bloats database size (base64 is 33% larger)
- Slow queries (large JSONB fields)
- No CDN delivery
- No image optimization/resizing
- Bandwidth waste

**Migration Plan:**

1. **Choose Storage Provider**
   - **Option A**: AWS S3 + CloudFront (industry standard)
   - **Option B**: Cloudinary (built-in optimization)
   - **Option C**: Supabase Storage (if migrating to Supabase)

2. **Create n8n Upload Endpoints**
   - POST `/users/:userId/assistants/:assistantId/avatar` - Upload avatar
   - POST `/chat-history/:userId/:chatId/files` - Upload chat attachments
   - DELETE `/users/:userId/assistants/:assistantId/avatar` - Delete avatar

3. **Migration Script**
   - Export all base64 files from AA_ASSISTANT.avatar_url
   - Export all base64 files from AA_CHAT_HISTORY.files
   - Upload to S3/Cloudinary
   - Update database with public URLs

4. **Update Frontend**
   - Change file upload logic to use new endpoints
   - Display images from URLs instead of base64
   - Add loading states for image downloads

**Performance Improvements:**
- 70% reduction in database size
- 10x faster query performance
- CDN delivery (faster image loading worldwide)
- Automatic image optimization and resizing

---

### 7. Starring Feature Backend Implementation
**Priority:** Medium
**Status:** Frontend completed, backend pending
**Code Location:** Frontend in `UserSlice.ts`, models have `starred` property

**What's Completed (Frontend Only):**
- Star/unstar UI for assistants and chats
- Redux state management (UserSlice.preferences)
- Star icons (StarIcon.tsx, StarFilledIcon.tsx)
- TypeScript models updated

**Backend Changes Needed:**

1. **Database Schema Changes**
   ```sql
   ALTER TABLE "AA_ASSISTANT"
   ADD COLUMN is_starred BOOLEAN DEFAULT FALSE,
   ADD COLUMN star_order INTEGER;

   ALTER TABLE "AA_CHAT"
   ADD COLUMN is_starred BOOLEAN DEFAULT FALSE,
   ADD COLUMN star_order INTEGER;

   CREATE INDEX idx_aa_assistant_starred
   ON "AA_ASSISTANT"(user_id, is_starred, star_order);

   CREATE INDEX idx_aa_chat_starred
   ON "AA_CHAT"(user_id, is_starred, star_order);
   ```

2. **New n8n Endpoints**
   - POST `/assistants/:userId/:assistantId/star` - Toggle assistant star
   - POST `/chats/:userId/:chatId/star` - Toggle chat star
   - PATCH `/assistants/:userId/star-order` - Update star order (drag-to-reorder)
   - PATCH `/chats/:userId/star-order` - Update star order

3. **Frontend Service Integration**
   - Create AssistantStarService.ts
   - Create ChatStarService.ts
   - Connect to new endpoints
   - Remove Redux-only state (sync with database)

**Benefits:**
- Starred items persist across devices
- Sync with database
- Can implement star order (drag-to-reorder)
- Analytics on most-starred assistants

---

### 8. Supabase Migration
**Priority:** Medium (after auth & storage)
**Status:** Comprehensive migration plan documented
**Documentation:** `.claude/SUPABASE_MIGRATION_PLAN.md`

**Why Migrate from n8n to Supabase:**

| Feature | Current (n8n) | Supabase | Benefit |
|---------|---------------|----------|---------|
| Database | PostgreSQL | PostgreSQL | Same |
| Auth | Manual (hardcoded) | Built-in Auth | Faster development |
| File Storage | Base64 in DB | S3-compatible | Better performance |
| Real-time | Polling (30s delay) | WebSocket | Instant updates |
| API | Manual webhooks | Auto-generated REST | Less maintenance |
| Security | Manual | Row Level Security | Better security |
| Cost | ~$64/month | ~$25/month | 61% savings |
| Dev Experience | Visual workflows | Code-first + Dashboard | Better DX |

**Migration Phases** (8-12 weeks):
1. **Phase 0**: Prerequisites (auth, storage, tests)
2. **Phase 1**: Database migration (schema + data)
3. **Phase 2**: Authentication migration (Supabase Auth)
4. **Phase 3**: API migration (replace webhooks with Supabase client)
5. **Phase 4**: Storage migration (Supabase Storage)
6. **Phase 5**: Real-time migration (WebSocket subscriptions)
7. **Phase 6**: Scheduled tasks (Edge Functions or keep n8n)
8. **Phase 7**: Testing & cutover

**Key Benefits:**
- Real-time updates (no more polling)
- Built-in authentication (JWT, OAuth, Magic Links)
- Auto-generated TypeScript types
- Built-in RLS (database-level security)
- Simpler architecture (less maintenance)
- Lower cost ($25/month vs $64/month)

**See detailed plan**: `.claude/SUPABASE_MIGRATION_PLAN.md`

---

### 9. Real-time Updates (WebSocket)
**Priority:** Low (wait for Supabase)
**Current State:** Polling every 30 seconds for unread messages

**Problems with Polling:**
- 30-second delay for new messages
- High server load (constant requests)
- Bandwidth waste (most requests return no changes)

**Real-time Solution** (with Supabase):
```typescript
// Subscribe to new messages
const subscription = supabase
  .channel(`chat:${chatId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'chat_history',
    filter: `chat_id=eq.${chatId}`
  }, (payload) => {
    dispatch(addMessage(payload.new));
  })
  .subscribe();
```

**Benefits:**
- Instant message delivery (< 500ms vs 30s)
- Lower server load
- Better user experience
- Enables collaborative features

---

### 10. Performance Optimizations
**Priority:** Medium
**Status:** Documented in backend architecture

**Database Optimizations Needed:**
1. Add indexes on all foreign keys
2. Add composite index on (chat_id, sent_date) for chat history loading
3. Add partial index on (user_id, unread) WHERE unread > 0
4. Implement cursor-based pagination (replace LIMIT 20)

**Query Optimizations:**
1. Batch SQL operations in transactions (DELETE cascades)
2. Use query result caching (Redis layer)
3. Implement connection pooling

**Application Optimizations:**
1. Lazy load chat history (load on scroll)
2. Implement virtual scrolling for long message lists
3. Optimize image loading (lazy loading, progressive JPEGs)
4. Add service worker for offline support

**Performance Targets:**
- API latency: < 100ms (currently 200-500ms)
- Chat history load: < 50ms (currently ~50ms - OK)
- Real-time message delivery: < 500ms (currently 30s polling)
- File upload: < 2s for 5MB file

---

## Design Philosophy Notes

### Minimalism and Elegance
- Prefer clean, focused interfaces over feature-heavy UIs
- Use elegant typography (Georgia serif for headings)
- Yellow (#FFD700) as primary action color (not blue)
- Claude-style thin scrollbars throughout
- Mandatory hover effects on all interactive elements
- Framer Motion animations for smooth interactions

### User Experience Principles
- Don't overwhelm users with too many options at once
- Features should be discoverable but not intrusive
- Keyboard shortcuts for power users
- Modals for complex features (Chat History, Settings, etc.)
- Inline for simple actions (New Chat, select agent)

---

## Contributing

When adding new features:
1. Follow existing design patterns and component structure
2. Maintain yellow (#FFD700) branding for primary actions
3. Use Claude-style scrollbars for scrollable areas
4. Add hover effects to all interactive list items
5. Include Framer Motion animations where appropriate
6. Update this document with new planned features
7. Document removed features with reasons and preserved code locations

---

**Maintained by:** Development Team
**Last Reviewed:** November 4, 2025
**Next Review:** December 2025
