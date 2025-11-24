# Desktop to Shared Packages Migration Plan

> **Goal:** Gradually migrate desktop app from local copies to shared packages over 3-4 weeks
> **Strategy:** Opportunistic migration - fix duplication when working on related code

---

## 📊 Current State Assessment

### Desktop Duplication Summary

| Category | Local Location | Shared Location | Status |
|----------|----------------|-----------------|--------|
| **Types** | `src/types/model/` | `@bgos/shared-types` | 100% duplicated |
| **Utilities** | `src/utils/` | `@bgos/shared-logic` | 80% duplicated |
| **State** | `src/slices/` | `@bgos/shared-state` | 100% duplicated |
| **Services** | `src/services/` | `@bgos/shared-services` | 60% duplicated |

### Impact Analysis

**Files to Migrate:** ~25 files
**Import Statements:** ~150+ import statements across desktop app
**Estimated Effort:** 3-4 weeks (part-time, opportunistic)

---

## 🎯 Migration Phases

### Phase 1: Types Migration (Week 1)
**Priority:** HIGH - Foundation for everything else

#### Files to Migrate
- [ ] `src/types/model/Chat.ts` → `@bgos/shared-types`
- [ ] `src/types/model/Assistant.ts` → `@bgos/shared-types`
- [ ] `src/types/model/ChatHistory.ts` → `@bgos/shared-types`
- [ ] `src/types/model/User.ts` → `@bgos/shared-types`
- [ ] `src/types/model/Notification.ts` → `@bgos/shared-types`

#### Migration Steps
```bash
# 1. Find all imports of local types
grep -r "from.*types/model" src/

# 2. Replace imports file by file
# Before:
import { Chat } from '../types/model/Chat';

# After:
import type { Chat } from '@bgos/shared-types';

# 3. Test after each file
npm run test
npm run dev  # Manual testing

# 4. Delete local type files after all imports updated
rm -rf src/types/model/
```

#### Success Criteria
- [ ] All components import from `@bgos/shared-types`
- [ ] `src/types/model/` directory deleted
- [ ] No TypeScript errors
- [ ] App runs successfully

---

### Phase 2: Utility Migration (Week 2)
**Priority:** HIGH - Fixes bugs and reduces duplication

#### Files to Migrate

##### High Priority (Exact duplicates)
- [ ] `src/utils/avatarUtils.ts` → `@bgos/shared-logic` (100% duplicate)
- [ ] `src/utils/dateFormatter.ts` → `@bgos/shared-logic` (99% duplicate)
- [ ] `src/utils/colors.ts` → `@bgos/shared-logic` (has bugs, use shared version)

##### Medium Priority (Could be shared)
- [ ] `src/utils/Base64Converter.ts` → `@bgos/shared-logic` (platform-agnostic)
- [ ] `src/utils/CodeHighlighter.ts` → `@bgos/shared-logic` (if needed by mobile)
- [ ] `src/utils/ArticleParser.ts` → `@bgos/shared-logic` (if needed by mobile)
- [ ] `src/utils/audioUtils.ts` → `@bgos/shared-logic` (with abstraction)
- [ ] `src/utils/imageUtils.ts` → `@bgos/shared-logic` (with abstraction)

##### Keep Desktop-Specific
- [x] `src/utils/exportChatHistory.ts` (uses file system)
- [x] `src/utils/selectors.ts` (desktop-specific selectors)
- [x] `src/utils/thunks.ts` (desktop-specific thunks)

#### Migration Steps

**For Exact Duplicates:**
```bash
# 1. Find imports
grep -r "from.*utils/avatarUtils" src/

# 2. Replace imports
# Before:
import { getInitials } from '../utils/avatarUtils';

# After:
import { getInitials } from '@bgos/shared-logic';

# 3. Delete local file
rm src/utils/avatarUtils.ts
```

**For Potential Shared Utils:**
```bash
# 1. Evaluate if mobile needs it
# 2. If yes, copy to shared package first
cp src/utils/Base64Converter.ts packages/shared-logic/src/utils/

# 3. Update shared package exports
# packages/shared-logic/src/index.ts
echo "export * from './utils/Base64Converter';" >> packages/shared-logic/src/index.ts

# 4. Build shared package
cd packages/shared-logic && npm run build && cd ../..

# 5. Update desktop imports
# import { Base64Converter } from '@bgos/shared-logic';

# 6. Test both mobile and desktop
# 7. Delete local copy if successful
```

#### Success Criteria
- [ ] Avatar utils using `@bgos/shared-logic`
- [ ] Date formatter using `@bgos/shared-logic`
- [ ] Colors using `@bgos/shared-logic` (bug fixed!)
- [ ] Shared utilities properly exported
- [ ] Local duplicates deleted

---

### Phase 3: State Management Migration (Week 2-3)
**Priority:** HIGH - Critical for consistent state

#### Special Consideration: ChatSlice Divergence

**Problem:** Desktop's `ChatSlice.ts` has additional timestamp estimation logic not in shared version.

**Solution Options:**
1. **Merge enhancements into shared** (Recommended)
   - Copy desktop's enhancements to shared package
   - Test with both mobile and desktop
   - Then migrate desktop to use shared
2. **Keep enhancement, extend shared** (Alternative)
   - Desktop extends shared slice with additional logic
   - More complex but preserves functionality

#### Files to Migrate

##### Strategy A: Merge to Shared First
- [ ] `src/slices/ChatSlice.ts` → Merge enhancements to `@bgos/shared-state`
- [ ] `src/slices/AssistantSlice.ts` → `@bgos/shared-state` (exact duplicate)
- [ ] `src/slices/ChatHistorySlice.ts` → `@bgos/shared-state` (exact duplicate)
- [ ] `src/slices/UISlice.ts` → `@bgos/shared-state` (exact duplicate)
- [ ] `src/slices/UserSlice.ts` → `@bgos/shared-state` (exact duplicate)

#### Migration Steps for Exact Duplicates

```bash
# 1. Find imports
grep -r "from.*slices/AssistantSlice" src/

# 2. Replace imports
# Before:
import assistantReducer from '../slices/AssistantSlice';

# After:
import { AssistantActions } from '@bgos/shared-state';
// Use shared store factory

# 3. Update store configuration
# src/config/storeConfig.ts
# Before:
import assistantReducer from '../slices/AssistantSlice';
import chatReducer from '../slices/ChatSlice';
export const store = configureStore({
  reducer: { assistants: assistantReducer, chats: chatReducer }
});

# After:
import { createStore } from '@bgos/shared-state';
export const store = createStore();

# 4. Delete local slices
rm src/slices/AssistantSlice.ts
# (Repeat for each slice)
```

#### Migration Steps for ChatSlice (with enhancements)

```bash
# 1. Analyze desktop enhancements
diff src/slices/ChatSlice.ts packages/shared-state/src/slices/ChatSlice.ts

# 2. Copy enhancements to shared
# Edit packages/shared-state/src/slices/ChatSlice.ts
# Add desktop's timestamp estimation logic

# 3. Build shared package
cd packages/shared-state && npm run build && cd ../..

# 4. Test with mobile
cd apps/mobile && npm run test

# 5. Update desktop to use enhanced shared version
# src/config/storeConfig.ts - use createStore()

# 6. Test desktop thoroughly
npm run test
npm run dev

# 7. Delete local ChatSlice if successful
rm src/slices/ChatSlice.ts
```

#### Success Criteria
- [ ] Desktop uses `createStore()` from shared
- [ ] All slices imported from `@bgos/shared-state`
- [ ] ChatSlice enhancements merged to shared
- [ ] Mobile still works with enhanced ChatSlice
- [ ] `src/slices/` directory deleted
- [ ] No state management issues

---

### Phase 4: Services Migration (Week 3-4)
**Priority:** MEDIUM - Important but more complex

#### Service Categories

##### Category 1: Direct Shared Equivalents (Easy)
- [ ] `src/services/ChatCRUDService.ts` → Use `@bgos/shared-services` (renameChat, deleteChat)
- [ ] `src/services/AssistantCRUDService.ts` → Use `@bgos/shared-services` (fetchAssistants, etc.)
- [ ] `src/services/ChatHistoryCRUDService.ts` → Use `@bgos/shared-services`

##### Category 2: Desktop Extensions (Moderate)
- [ ] `src/services/elevenLabsEventService.ts` → Evaluate if shareable
- [ ] `src/services/FetchUnreadMessagesService.ts` → Evaluate if shareable

##### Category 3: Desktop-Specific (Keep)
- [x] `src/services/DatabaseSyncService.ts` (Electron IPC - desktop only)

#### Migration Strategy

**For Direct Equivalents:**
```typescript
// Before (Desktop service using fetch)
// src/services/ChatCRUDService.ts
export async function renameChat(userId: string, chatId: string, newTitle: string) {
  const response = await fetch(url, { method: 'PATCH', ... });
  return response.json();
}

// After (Using shared service)
import { renameChat } from '@bgos/shared-services';

// In component:
await renameChat(userId, chatId, newTitle);
```

**For Desktop Extensions:**
```typescript
// If desktop needs extra functionality beyond shared
import { renameChat as sharedRenameChat } from '@bgos/shared-services';
import { ipcRenderer } from 'electron';

export async function renameChat(userId: string, chatId: string, newTitle: string) {
  // Use shared service for API call
  await sharedRenameChat(userId, chatId, newTitle);

  // Desktop-specific: Update local database
  await ipcRenderer.invoke('update-local-chat', { chatId, title: newTitle });
}
```

#### Migration Steps

```bash
# 1. Find all usages of desktop service
grep -r "from.*services/ChatCRUDService" src/

# 2. Check if shared equivalent exists
grep -r "renameChat" packages/shared-services/

# 3a. If exists: Replace with shared import
# Before:
import { renameChat } from '../services/ChatCRUDService';

# After:
import { renameChat } from '@bgos/shared-services';

# 3b. If doesn't exist: Add to shared first
# Add function to packages/shared-services/src/api/chatApi.ts
# Build shared package
# Then use in desktop

# 4. If desktop needs extension: Create wrapper
# src/services/DesktopChatService.ts wraps shared + adds IPC

# 5. Delete local service if fully replaced
rm src/services/ChatCRUDService.ts
```

#### Success Criteria
- [ ] API calls use `@bgos/shared-services`
- [ ] Desktop services either deleted or are thin wrappers
- [ ] Axios used consistently (no more fetch)
- [ ] Desktop-specific services clearly marked
- [ ] No duplicated API logic

---

## 🔄 Opportunistic Migration Workflow

### When to Migrate

**Migrate a file when you:**
- Are fixing a bug in that file
- Are adding a feature to that file
- Are refactoring that file
- Are adding tests to that file
- Have spare time and want to reduce tech debt

### How to Migrate Opportunistically

```bash
# 1. Working on ChatArea.tsx
# Notice: import { Chat } from '../types/model/Chat';

# 2. While you're in the file, migrate the import
# Change to: import type { Chat } from '@bgos/shared-types';

# 3. Test your changes + the migration
npm run test

# 4. Commit both changes together
git commit -m "feat(desktop): add feature X, migrate Chat type to shared"

# 5. Update migration checklist
# Mark Chat.ts as migrated in this plan
```

### Migration Checklist Per File

For each file you migrate:

1. **Before:**
   - [ ] Identify local import
   - [ ] Verify shared equivalent exists
   - [ ] Check for any customizations

2. **During:**
   - [ ] Replace import with shared
   - [ ] Update usage if needed
   - [ ] Run tests
   - [ ] Manual testing

3. **After:**
   - [ ] Commit changes
   - [ ] Update this migration plan
   - [ ] If all imports of local file replaced, delete local file

---

## 📋 Complete Migration Checklist

### Types (`src/types/model/`)
- [ ] Assistant.ts
- [ ] Chat.ts
- [ ] ChatHistory.ts
- [ ] Notification.ts
- [ ] User.ts
- [ ] **Delete** `src/types/model/` directory when complete

### Utilities (`src/utils/`)
**Migrate to Shared:**
- [ ] avatarUtils.ts
- [ ] colors.ts
- [ ] dateFormatter.ts
- [ ] Base64Converter.ts (optional)
- [ ] CodeHighlighter.ts (optional)
- [ ] ArticleParser.ts (optional)
- [ ] audioUtils.ts (optional)
- [ ] imageUtils.ts (optional)

**Keep Desktop-Specific:**
- [x] exportChatHistory.ts
- [x] selectors.ts
- [x] thunks.ts

### State (`src/slices/`)
- [ ] AssistantSlice.ts
- [ ] ChatSlice.ts (merge enhancements first!)
- [ ] ChatHistorySlice.ts
- [ ] UISlice.ts
- [ ] UserSlice.ts
- [ ] Update `src/config/storeConfig.ts` to use `createStore()`
- [ ] **Delete** `src/slices/` directory when complete

### Services (`src/services/`)
**Migrate to Shared:**
- [ ] AssistantCRUDService.ts
- [ ] ChatCRUDService.ts
- [ ] ChatHistoryCRUDService.ts
- [ ] elevenLabsEventService.ts (evaluate)
- [ ] FetchUnreadMessagesService.ts (evaluate)

**Keep Desktop-Specific:**
- [x] DatabaseSyncService.ts (Electron IPC)

### Store Configuration
- [ ] Migrate `src/config/storeConfig.ts` to use `createStore()` from shared

---

## 🎯 Success Metrics

### Quantitative Goals
- [ ] 0 duplicated type files (target: 5 files deleted)
- [ ] <5 duplicated utility files (target: 3-8 files deleted/migrated)
- [ ] 0 duplicated Redux slices (target: 5 files deleted)
- [ ] <3 duplicated service files (target: 3-5 files migrated)
- [ ] <10 local imports to shared code (target: ~150+ imports fixed)

### Qualitative Goals
- [ ] Desktop uses `@bgos/shared-*` consistently
- [ ] No more "Which version is correct?" questions
- [ ] Bug fixes propagate to both platforms automatically
- [ ] Easier onboarding (one source of truth)
- [ ] Faster development (no duplicate work)

---

## 🚨 Risk Mitigation

### Risk #1: Breaking Changes

**Mitigation:**
- Migrate incrementally (one file at a time)
- Test after each migration
- Keep git history clean (easy to revert)
- Test both mobile and desktop after shared changes

### Risk #2: ChatSlice Enhancements

**Mitigation:**
- Merge enhancements to shared carefully
- Test thoroughly with both platforms
- Consider feature flags if unsure
- Document the merge process

### Risk #3: Lost Desktop Functionality

**Mitigation:**
- Audit desktop features before migrating
- Keep desktop-specific services clearly marked
- Use wrapper pattern for desktop extensions
- Document what's desktop-specific

### Risk #4: Import Path Confusion

**Mitigation:**
- Use ESLint rule to enforce `@bgos/*` imports
- Use `/validate-imports` command before commits
- Regular audits of import paths
- Clear documentation

---

## 📊 Progress Tracking

### Week 1 Progress
- [ ] Types migration complete
- [ ] % of type imports fixed: ___/150

### Week 2 Progress
- [ ] Utility migration complete
- [ ] % of utility imports fixed: ___/80

### Week 3 Progress
- [ ] State migration complete
- [ ] Store using shared factory

### Week 4 Progress
- [ ] Services migration complete
- [ ] % of service imports fixed: ___/50
- [ ] Overall migration complete

---

## 🛠️ Migration Tools

### Find Duplicates Script
```bash
#!/bin/bash
# find-duplicates.sh
echo "=== Type Duplicates ==="
find src/types/model -name "*.ts" | while read file; do
  filename=$(basename "$file")
  echo "Desktop: $file"
  echo "Shared: packages/shared-types/src/$filename"
  diff -q "$file" "packages/shared-types/src/$filename" 2>/dev/null || echo "Different or missing"
  echo ""
done

echo "=== Utility Duplicates ==="
for util in avatarUtils colors dateFormatter; do
  echo "Desktop: src/utils/$util.ts"
  echo "Shared: packages/shared-logic/src/utils/$util.ts"
  diff -q "src/utils/$util.ts" "packages/shared-logic/src/utils/$util.ts" 2>/dev/null || echo "Different or missing"
  echo ""
done
```

### Find Import References
```bash
# Find all imports of a specific file
grep -r "from.*types/model/Chat" src/ | wc -l

# Find all files importing from local paths
grep -r "from '\.\." src/ | grep -E "(types|utils|slices)" | wc -l
```

### Validate Migration
```bash
# After migration, check for remaining local imports
echo "Remaining type imports:"
grep -r "from.*types/model" src/ | wc -l

echo "Remaining util imports:"
grep -r "from.*utils/(avatar|color|date)" src/ | wc -l

echo "Remaining slice imports:"
grep -r "from.*slices/" src/ | wc -l
```

---

## 📚 Related Documentation

- `ARCHITECTURE.md` - Monorepo structure and shared packages
- `DEVELOPMENT_GUIDELINES.md` - Best practices for shared package usage
- `SHARED_PACKAGES_REFERENCE.md` - Complete API reference
- `.claude/prompts/desktop.md` - Desktop development context

---

## 🆘 Getting Help

### If You Get Stuck

1. **Check if shared equivalent exists**
   ```bash
   grep -r "functionName" packages/
   ```

2. **Review mobile implementation**
   - Mobile uses shared packages correctly
   - Check `apps/mobile/src/` for examples

3. **Test incrementally**
   - Migrate one file at a time
   - Test after each change
   - Revert if issues arise

4. **Ask for clarification**
   - Not sure if something belongs in shared?
   - Check `ARCHITECTURE.md` for guidance
   - When in doubt, ask!

---

## 📝 Summary

**Migration Strategy:**
- **Incremental:** One file at a time
- **Opportunistic:** Migrate when touching code
- **Tested:** Test after each migration
- **Documented:** Track progress in this plan

**Timeline:**
- Week 1: Types
- Week 2: Utilities + State
- Week 3-4: Services + Cleanup

**Goal:**
Desktop uses `@bgos/shared-*` packages consistently, eliminating duplication and establishing single source of truth.

**Success:**
When `src/types/model/`, most of `src/utils/`, and `src/slices/` are deleted, replaced by clean `@bgos/shared-*` imports.

**Remember:**
- Mobile is the gold standard - it does it right
- Migrate gradually, test thoroughly
- Update this plan as you progress
- Don't be afraid to revert if something breaks

**Let's eliminate this tech debt and make the codebase better! 🚀**
