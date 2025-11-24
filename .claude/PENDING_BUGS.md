# Pending Bugs to Investigate

## 1. Chat Timestamps Showing "Recently"

**Issue:** Most chats in the chat list are showing "last message Recently" instead of actual timestamps like "2 hours ago", "1 day ago", etc.

**Root Cause:** Backend is not consistently returning `last_message_date` or `created_at` fields when fetching chats.

**What's Working:**
- One chat is showing "1 day ago" (has valid timestamp data)
- Frontend mapping functions are correct (mappers.ts updated)
- Date formatting logic is working (dateFormatter.ts)

**What Needs Investigation:**
- n8n backend workflow at `/webhook/b6f845bc-2d9c-43b2-8412-c81871c8bf89/{userId}/chats`
- The "Select Chats" node should include `last_message_date` subquery:
  ```sql
  SELECT c.id, c.assistant_id, c.user_id, c.title, c.unread, c.feedback_period,
  (SELECT MAX(sent_date) FROM "AA_CHAT_HISTORY" h WHERE h.chat_id = c.id) as last_message_date
  FROM "AA_CHAT" c WHERE c.user_id = '{{$json["params"]["userId"]}}'
  ORDER BY last_message_date DESC NULLS LAST, c.id DESC
  ```
- Verify the backend is actually running this query and returning the field

**Files Modified:**
- `packages/shared-services/src/api/mappers.ts` - Added timestamp mapping
- `packages/shared-logic/src/utils/dateFormatter.ts` - Added timestamp utilities
- `packages/shared-types/src/Chat.ts` - Added timestamp fields

**Next Steps:**
1. Check n8n workflow configuration
2. Test backend API response manually
3. Add temporary logging to see what backend returns
4. Fix backend if needed, or implement frontend fallback

---

## 2. "Loading Messages" Bug When Sending New Message

**Issue:** When trying to send a new message (especially the first message in a new chat), the app shows "Loading messages..." screen and gets stuck.

**Symptoms:**
- User types message and hits send
- Screen shows "Loading messages..." with spinner
- Takes long time or gets stuck

**Potential Causes:**
- The `loading` state in `useChatHistory.ts` is being set to `true`
- The `filteredMessages` array might be temporarily empty during chat creation
- Race condition when:
  1. ChatScreen creates temp message with `chatId: 'new'`
  2. Backend creates chat with real ID
  3. Navigation updates `chatId` param
  4. `filteredMessages` re-runs and returns empty (messages have old chatId)
  5. Loading screen shows if `loading` is still `true`

**What NOT to Do:**
- Do NOT add debugging console.logs to `ChatScreen.tsx` render method (causes white screen crash)

**What to Investigate:**
- Add logging to `useChatHistory.ts` `loadChatHistory` function (safe)
- Check when `loading` is set to `true` and `false`
- Verify message chatId updates happen before navigation
- Check if `sendMessageWithChatId` is properly updating loading state

**Files Involved:**
- `apps/mobile/src/hooks/useChatHistory.ts` - Manages loading state
- `apps/mobile/src/screens/chat/ChatScreen.tsx` - Displays loading screen
- `apps/mobile/src/services/chatService.ts` - Backend communication

**Current Code Location:**
- Loading check: `ChatScreen.tsx` line 270-277
- Message send: `ChatScreen.tsx` line 124+ (handleSend function)
- State management: `useChatHistory.ts` line 15-40

**Next Steps:**
1. Add safe logging to `useChatHistory.ts` only
2. Reproduce the bug and check logs
3. Verify the sequence of events during message send
4. Fix timing/race condition if found
5. Ensure loading state is properly reset after operations

---

## 3. Voice Agent - First Press Still Causes Reload (PARTIALLY FIXED)

**Status:** Mostly Fixed - Modal approach works, but first press still triggers reload

**Issue:** When pressing the voice agent button for the FIRST time after app start, the app still reloads/crashes. However, on the SECOND press, it works perfectly and the voice conversation flows normally.

**Root Cause Found:** The original issue was `react-native-screens` native implementation conflicting with WebRTC/LiveKit audio initialization. The native side was tearing down the screen ~50ms after audio started.

**Solution Applied:**
- Switched from navigation-based `VoiceAgentScreen` to React Native's built-in `Modal` component
- Created `VoiceAgentModal.tsx` with `presentationStyle="fullScreen"`
- Added modal control state to `VoiceAgentContext.tsx` (isModalVisible, showVoiceModal, hideVoiceModal)
- Added `VoiceModalRenderer` in `App.tsx` to render modal at root level
- Updated `MessageInput.tsx` to call `showVoiceModal()` instead of `navigation.navigate('VoiceAgent')`

**Files Modified:**
- `apps/mobile/src/contexts/VoiceAgentContext.tsx` - Added modal state and control functions
- `apps/mobile/App.tsx` - Added VoiceModalRenderer component
- `apps/mobile/src/components/chat/MessageInput.tsx` - Changed from navigation to showVoiceModal

**Remaining Issue:**
- First press after app start still causes reload (possibly related to LiveKit/WebRTC initialization)
- Second press works perfectly

**Next Steps:**
1. Investigate why first WebRTC initialization causes reload
2. Possibly pre-initialize WebRTC on app start
3. Or add retry logic that automatically re-opens modal after first failure

---

## 4. Voice Agent - Transcript Not Saved to Chat After Call Ends

**Status:** Not Implemented

**Issue:** When the voice call ends, the transcript should be saved to the chat and displayed in the chat history. Currently, the modal just closes without saving the conversation.

**Expected Behavior (from Desktop):**
1. User clicks "End Call"
2. App fetches official transcript from ElevenLabs API
3. If new chat, creates chat with title "Speech-to-Speech conversation"
4. Maps transcript messages to ChatHistory format
5. Saves messages to backend via `saveChatHistory` API
6. Refreshes chat UI to show the conversation

**Desktop Implementation Reference:**
- `src/components/voiceAgent/VoiceAgentButton.tsx` - Lines 209-267 (fetchAndSaveTranscript)
- `src/hooks/useTranscriptFetch.ts` - Fetches transcript from ElevenLabs
- `src/services/ChatHistoryCRUDService.ts` - Saves to backend

**What Mobile Has:**
- `elevenLabsService.ts` has `fetchConversationTranscript()` - same API call as desktop
- `useVoiceSession.ts` has `transcript` state with messages during call
- `VoiceAgentContext.tsx` has `onTranscriptReady` callback mechanism (partially implemented)

**What Mobile Needs:**
1. When call ends in `VoiceAgentModal`:
   - Store the `conversationId` before ending session
   - Wait 1 second after session ends
   - Call `fetchConversationTranscript(conversationId)`
   - If new chat: create new chat via API
   - Map transcript to ChatHistory format: `{ text, sender: 'user'|'assistant', chatId, sentDate }`
   - Call backend to save: POST to `/webhook/.../chat-history/{userId}`
   - Trigger `onTranscriptReady` callback to refresh ChatScreen

**Backend API for saving chat history:**
```
POST https://n8n-test.brandgrowthos.ai/webhook/b6f845bc-2d9c-43b2-8412-c81871c8bf89/chat-history/{userId}
Body: { messages: ChatHistory[] }
```

**Files to Modify:**
- `apps/mobile/src/components/voice/VoiceAgentModal.tsx` - Add transcript save logic in handleEndCall
- `apps/mobile/src/hooks/useVoiceSession.ts` - Ensure conversationId is accessible
- `apps/mobile/src/screens/chat/ChatScreen.tsx` - Handle transcript ready callback

---

## Successfully Fixed Issues (For Reference)

✅ Copy button background color matching app
✅ Copy icon using desktop SVG design
✅ Yellow checkmark on copy
✅ Toast notification with brand colors
✅ No white screen crashes
✅ Voice Agent screen unmount crash (Modal-based solution - mostly fixed)
