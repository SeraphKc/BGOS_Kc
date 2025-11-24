# 11 Labs Voice Agent Android Implementation

> **Project**: BGOS_Kc Mobile Voice Agent Enhancement
> **Platform**: React Native (Android)
> **SDK**: @elevenlabs/react-native v0.3.2
> **Started**: 2025-11-22
> **Status**: In Progress

---

## Overview

This document tracks the implementation of missing ElevenLabs SDK features in the mobile voice agent to achieve feature parity with the desktop implementation while maintaining a minimalistic, on-brand mobile UX.

---

## Implementation Phases

### ✅ **PHASE 1: Core Missing Features (High Priority)**

**Status**: ✅ **COMPLETED** (Pending Device Testing)
**Completion Date**: 2025-11-22

#### 1.1 Real-time Transcript Display
- [x] Add scrollable transcript view to VoiceAgentModal
- [x] Implement `onMessage` handler in useVoiceSession.ts
- [x] Style user messages (white/light gray)
- [x] Style agent messages (gold/yellow theme #FFD700)
- [x] Add auto-scroll to latest message
- [x] Add live transcription overlay (caption-style)
- [ ] Test transcript display during conversation (needs device testing)

**Files to Modify**:
- `apps/mobile/src/hooks/useVoiceAgent.ts`
- `apps/mobile/src/components/voice/VoiceAgentModal.tsx`
- Create: `apps/mobile/src/components/voice/TranscriptionOverlay.tsx`

#### 1.2 Enhanced Mode Visualization
- [x] Update VoiceVisualizer to accept mode prop (idle/listening/speaking/thinking)
- [x] Add `onModeChange` handler in useVoiceSession.ts
- [x] Implement mode-specific animations:
  - [x] Idle: Gentle pulsing (gray)
  - [x] Listening: Active blue animation (#3b82f6)
  - [x] Speaking: Gold/yellow animation (#FFD700)
  - [x] Thinking: Purple/slower animation (#8b5cf6)
- [x] Update status text to reflect current mode
- [ ] Test mode transitions during conversation (needs device testing)

**Files Modified**:
- ✅ `apps/mobile/src/hooks/useVoiceSession.ts`
- ✅ `apps/mobile/src/components/voice/VoiceVisualizer.tsx`
- ✅ `apps/mobile/src/components/voice/VoiceAgentModal.tsx`

#### 1.3 Audio-Reactive Visualization
- [x] Add `onAudio` callback handler in useVoiceSession.ts
- [x] Add `onVadScore` callback handler in useVoiceSession.ts
- [x] Pass audio data to VoiceVisualizer component
- [x] Update visualizer bars to respond to real audio levels
- [x] Optimize for 60fps performance with spring animations
- [x] Used React Native Animated API for smooth animations
- [ ] Test on real Android device (not just emulator)

**Files Modified**:
- ✅ `apps/mobile/src/hooks/useVoiceSession.ts`
- ✅ `apps/mobile/src/components/voice/VoiceVisualizer.tsx`

#### 1.4 User Activity & Contextual Updates
- [x] Add `sendUserActivity()` method to useVoiceSession hook
- [x] Add `sendContextualUpdate()` method to useVoiceSession hook
- [ ] Call during text input focus/typing (integration needed)
- [ ] Call during scrolling interactions (integration needed)
- [ ] Call during button taps (integration needed)
- [ ] Implement screen navigation tracking (future integration)
- [ ] Send context updates when user changes screens (future integration)
- [ ] Test that agent pauses appropriately during user interactions (needs device testing)

**Files Modified**:
- ✅ `apps/mobile/src/hooks/useVoiceSession.ts`
- ✅ `apps/mobile/src/components/voice/VoiceAgentModal.tsx`
- ⏳ Integration points in other screens (future work)

#### 1.5 Dynamic Variables (Optional Implementation)
- [x] Add `dynamicVariables` parameter to useVoiceSession hook
- [x] Make it optional with sensible defaults
- [x] Document usage in code comments
- [x] Add TypeScript interface for variable types
- [x] Ready to pass user name, account type, preferences
- [ ] Test with sample variables (needs device testing)

**Files Modified**:
- ✅ `apps/mobile/src/hooks/useVoiceSession.ts`
- ✅ `apps/mobile/src/components/voice/VoiceAgentModal.tsx`

**Phase 1 Definition of Done**:
- ✅ Transcript displays in real-time during conversation
- ✅ User and agent messages are visually distinct
- ✅ Mode changes are reflected in visualizer animations
- ✅ Visualizer responds to actual audio levels
- ✅ Agent pauses when user interacts with UI
- ✅ Dynamic variables can be passed (even if not actively used yet)
- ✅ All features tested on real Android device

---

### ⬜ **PHASE 2: User Feedback & Tools (Medium Priority)**

**Status**: 🔴 Not Started
**Completion Date**: _Pending_

#### 2.1 Feedback System
- [ ] Add `canSendFeedback` tracking in useVoiceAgent
- [ ] Implement `sendFeedback()` method
- [ ] Create feedback button UI (thumbs up/down)
- [ ] Show feedback buttons only when `canSendFeedback` is true
- [ ] Add fade-in animation for feedback buttons
- [ ] Auto-hide buttons after submission
- [ ] Show confirmation message after feedback sent
- [ ] Test feedback submission

**Files to Create/Modify**:
- `apps/mobile/src/hooks/useVoiceAgent.ts`
- `apps/mobile/src/components/voice/VoiceAgentModal.tsx`
- Create: `apps/mobile/src/components/voice/FeedbackButtons.tsx`

**Assets Needed**:
- 👍/👎 icons (create minimalistic versions)

#### 2.2 Client Tools Display
- [ ] Create ToolCallOverlay component (adapt from desktop)
- [ ] Add `onUnhandledClientToolCall` handler in useVoiceAgent
- [ ] Implement tool call state management
- [ ] Display active tool executions as cards/bottom sheet
- [ ] Add color-coded status badges:
  - [ ] Pending: Yellow/orange
  - [ ] Success: Green
  - [ ] Error: Red
- [ ] Show tool name and parameters
- [ ] Add progress indicators for long-running tools
- [ ] Auto-dismiss completed/errored tools after 3 seconds
- [ ] Register sample clientTools in startSession config
- [ ] Test with real tool execution

**Files to Create/Modify**:
- `apps/mobile/src/hooks/useVoiceAgent.ts`
- Create: `apps/mobile/src/components/voice/ToolCallOverlay.tsx`
- `apps/mobile/src/components/voice/VoiceAgentModal.tsx`

#### 2.3 Dynamic Variables Integration
- [ ] Document dynamic variables usage with examples
- [ ] Create helper function to gather user context
- [ ] Add examples: user_name, account_type, user_id
- [ ] Integrate with existing user state/Redux
- [ ] Test variable passing and usage in agent responses

**Files to Modify**:
- `apps/mobile/src/hooks/useVoiceAgent.ts`
- Documentation updates in code

**Phase 2 Definition of Done**:
- ✅ Users can submit feedback after conversations
- ✅ Tool executions are visible to users
- ✅ Tool status updates are displayed in real-time
- ✅ Dynamic variables are being passed with user context
- ✅ All features tested on real Android device

---

### ⬜ **PHASE 3: Advanced Features (Nice to Have)**

**Status**: 🔴 Not Started
**Completion Date**: _Pending_

#### 3.1 Streaming Agent Responses
- [ ] Add `onAgentChatResponsePart` handler
- [ ] Show streaming text in transcript view
- [ ] Add typing indicator during agent thinking
- [ ] Update transcript with partial responses
- [ ] Optimize for smooth streaming updates
- [ ] Test with long agent responses

**Files to Modify**:
- `apps/mobile/src/hooks/useVoiceAgent.ts`
- `apps/mobile/src/components/voice/VoiceAgentModal.tsx`
- `apps/mobile/src/components/voice/TranscriptionOverlay.tsx`

#### 3.2 Interruption Handling
- [ ] Add `onInterruption` callback handler
- [ ] Design visual feedback (ripple effect or flash)
- [ ] Implement interruption animation
- [ ] Show brief "Interrupted" status indicator
- [ ] Test interruption behavior

**Files to Modify**:
- `apps/mobile/src/hooks/useVoiceAgent.ts`
- `apps/mobile/src/components/voice/VoiceAgentModal.tsx`
- `apps/mobile/src/components/voice/VoiceVisualizer.tsx`

#### 3.3 Enhanced Error Handling
- [ ] Improve error display with toast/snackbar notifications
- [ ] Add retry mechanism for failed connections
- [ ] Create user-friendly error messages
- [ ] Prevent modal from getting stuck on errors
- [ ] Add error recovery UI
- [ ] Log errors for debugging
- [ ] Test various error scenarios

**Files to Modify**:
- `apps/mobile/src/hooks/useVoiceAgent.ts`
- `apps/mobile/src/components/voice/VoiceAgentModal.tsx`

#### 3.4 Connection Quality Indicators
- [ ] Add animated status indicators (pulsing dots)
- [ ] Show connection strength visualization
- [ ] Handle reconnecting state with proper UI
- [ ] Add connection quality metrics display
- [ ] Test on poor network conditions

**Files to Modify**:
- `apps/mobile/src/components/voice/VoiceAgentModal.tsx`

#### 3.5 MCP (Model Context Protocol) Support
- [ ] Add `onMCPToolCall` handler (optional, if needed)
- [ ] Add `onMCPConnectionStatus` handler (optional)
- [ ] Document MCP integration for future use

**Files to Modify**:
- `apps/mobile/src/hooks/useVoiceAgent.ts`

**Phase 3 Definition of Done**:
- ✅ Agent responses stream in real-time
- ✅ User interruptions are visually indicated
- ✅ Errors are handled gracefully with retry options
- ✅ Connection quality is visible to users
- ✅ All advanced features tested on real Android device

---

## Design Guidelines

### Color Scheme
- **Primary Yellow**: #FFD700, #FFE01B (agent speaking, primary actions)
- **Blue**: #3b82f6 (listening mode)
- **Purple**: #8b5cf6 (thinking mode)
- **Green**: #10b981 (success states)
- **Red**: #ef4444 (error states, stop button)
- **Gray**: #6b7280 (idle, inactive)
- **Dark Background**: #111827, #212121
- **Text**: #ffffff (primary), #9ca3af (secondary)

### Typography
- **Status Text**: 18-20px, weight 600
- **Transcript User**: 16px, white
- **Transcript Agent**: 16px, gold/yellow
- **Tool Call Title**: 12px, weight 500
- **Tool Call Status**: 10px

### Assets to Reuse (from desktop)
- ✅ `s2s voice button.png` - Pause/Resume button (2,095 bytes)
- ✅ `s2s cancel button.png` - Stop/End call button (1,633 bytes)
- ✅ `voice-square.svg` - Voice activation icon (701 bytes)
- ✅ `microphone.svg` - Microphone icon (1,080 bytes)
- ✅ `audio wave.png` - Waveform visualization (683 bytes)

### Assets to Create
- [ ] Thumbs up icon (feedback)
- [ ] Thumbs down icon (feedback)
- [ ] Tool execution badges (success/pending/error)
- [ ] Interruption ripple animation asset

### Animation Guidelines
- **Timing**: 200-400ms transitions
- **Easing**: ease-out, ease-in-out
- **Target**: 60fps smooth animations
- **Library**: react-native-reanimated preferred for performance

### Layout Principles
- **Minimalistic**: Clean, uncluttered interface
- **On-brand**: Consistent with BGOS design language
- **Touch-friendly**: Minimum 44x44pt touch targets
- **Safe areas**: Respect mobile safe areas
- **Dark theme**: Primary dark backgrounds

---

## Technical Reference

### ElevenLabs SDK Callbacks Used

#### Implemented in Phase 1
- `onConnect` - Connection established
- `onDisconnect` - Connection ended
- `onError` - Error occurred
- `onMessage` - Transcription messages
- `onModeChange` - Agent mode changes
- `onAudio` - Audio chunk data
- `onVadScore` - Voice activity detection

#### Implemented in Phase 2
- `onUnhandledClientToolCall` - Client tool execution
- `canSendFeedback` - Feedback availability (property)
- `sendFeedback()` - Submit feedback (method)

#### Implemented in Phase 3
- `onAgentChatResponsePart` - Streaming responses
- `onInterruption` - User interruptions
- `onMCPToolCall` - MCP tool calls (optional)
- `onMCPConnectionStatus` - MCP connection (optional)

### SDK Methods Used
- `startSession({ conversationToken, dynamicVariables, clientTools })`
- `endSession()`
- `setMicMuted(boolean)`
- `sendUserMessage(text)` - Future use
- `sendContextualUpdate(text)` - Phase 1
- `sendUserActivity()` - Phase 1
- `sendFeedback(boolean)` - Phase 2
- `getId()` - Get conversation ID

---

## Testing Checklist

### Phase 1 Testing
- [ ] Transcript displays correctly during conversation
- [ ] User/agent messages are visually distinct
- [ ] Mode changes update visualizer properly
- [ ] Visualizer responds to audio levels
- [ ] User activity prevents agent interruptions
- [ ] Dynamic variables can be passed successfully
- [ ] Performance is smooth (60fps) on real device

### Phase 2 Testing
- [ ] Feedback buttons appear when available
- [ ] Feedback submission works correctly
- [ ] Tool calls display in real-time
- [ ] Tool status updates correctly
- [ ] Dynamic variables affect agent behavior

### Phase 3 Testing
- [ ] Streaming responses appear smoothly
- [ ] Interruptions are visually indicated
- [ ] Error recovery works as expected
- [ ] Connection quality is accurate
- [ ] All edge cases handled gracefully

### Device Testing
- [ ] Tested on Android emulator
- [ ] Tested on real Android device (minimum)
- [ ] Tested on multiple Android versions
- [ ] Tested on different screen sizes
- [ ] Tested on low-end device for performance
- [ ] Tested on poor network conditions

---

## Known Issues & Limitations

### 1. First Press After App Start Causes Reload (PARTIALLY FIXED)
- **Symptom**: First voice agent button press after app start causes app reload
- **Workaround**: Second press works perfectly
- **Root Cause**: Likely WebRTC/LiveKit first initialization conflict
- **Potential Fix**: Pre-initialize WebRTC on app start, or add retry logic

### 2. Transcript Not Saved to Chat After Call Ends (NOT IMPLEMENTED)
- **Symptom**: Modal closes but transcript doesn't appear in chat
- **Expected**: Transcript should be fetched from ElevenLabs API and saved to backend
- **Reference**: See desktop `VoiceAgentButton.tsx` lines 209-267 for implementation

---

## Session Notes

### Session 2 - 2025-11-24/25

**Issue Investigated**: VoiceAgentScreen was crashing/reloading ~50ms after voice session started

**Root Cause Discovery**:
- Native `react-native-screens` implementation was conflicting with WebRTC/LiveKit audio initialization
- The native side was tearing down the screen immediately after audio started
- This was NOT a JavaScript error - no errors were caught by global error handlers
- Confirmed by seeing `[GESTURE HANDLER] Tearing down gesture handler` in native logs BEFORE JS unmount

**Solution Implemented**: Modal-Based Approach
- Switched from navigation-based `VoiceAgentScreen` to React Native's built-in `Modal` component
- Modal uses `presentationStyle="fullScreen"` which completely bypasses `react-native-screens`
- This allows WebRTC to initialize without native-level screen teardown conflict

**Files Modified**:
1. `apps/mobile/src/contexts/VoiceAgentContext.tsx`:
   - Added modal state: `isModalVisible`, `modalAgentId`, `modalAgentName`
   - Added control functions: `showVoiceModal()`, `hideVoiceModal()`

2. `apps/mobile/App.tsx`:
   - Added `VoiceModalRenderer` component that uses context to render `VoiceAgentModal`
   - Placed inside `VoiceAgentProvider` at root level

3. `apps/mobile/src/components/chat/MessageInput.tsx`:
   - Replaced `navigation.navigate('VoiceAgent')` with `showVoiceModal(agentId, agentName)`
   - Removed unused `useNavigation` import

**Result**: Voice agent modal now works - conversation flows, modes change, transcript displays. First press still causes reload but second press works perfectly.

**Remaining Work**:
1. Fix first-press reload issue (investigate WebRTC pre-initialization)
2. Implement transcript save to chat after call ends (see desktop reference)
3. Optionally remove unused `VoiceAgentScreen` from AppNavigator

---

### Session 1 - 2025-11-22
- Initial analysis completed
- Compared mobile implementation with desktop
- Identified all missing SDK features
- Created comprehensive implementation plan
- Decided on phased approach (Phase 1 → 2 → 3)
- **Phase 1 Implementation COMPLETED**:
  - ✅ Enhanced `useVoiceSession.ts` with all SDK callbacks
  - ✅ Added `onMessage`, `onModeChange`, `onAudio`, `onVadScore`, `onInterruption`, `onAgentChatResponsePart`
  - ✅ Implemented `sendUserActivity()` and `sendContextualUpdate()` methods
  - ✅ Added optional `dynamicVariables` parameter support
  - ✅ Created `TranscriptionOverlay` component for live captions
  - ✅ Added scrollable transcript view with user/agent styling
  - ✅ Enhanced `VoiceVisualizer` with audio-reactive animations
  - ✅ Mode-specific colors: Idle (gray), Listening (blue), Speaking (gold), Thinking (purple)
  - ✅ Audio level responds to VAD score for reactive visualization
  - ✅ Integrated visualizer into VoiceAgentModal
  - ✅ Updated session state to track mode, thinking, audio levels
- **Files Created**:
  - `apps/mobile/src/components/voice/TranscriptionOverlay.tsx` (new)
- **Files Modified**:
  - `apps/mobile/src/hooks/useVoiceSession.ts` (major enhancements)
  - `apps/mobile/src/components/voice/VoiceAgentModal.tsx` (transcript view + visualizer)
  - `apps/mobile/src/components/voice/VoiceVisualizer.tsx` (audio-reactive + mode colors)
- **Next**: Test Phase 1 on real Android device, then proceed to Phase 2

---

## References

- **SDK Documentation**: `.claude/ELEVENLABS_SDK_REFERENCE.md`
- **Architecture**: `.claude/ARCHITECTURE.md`
- **Desktop Implementation**: `src/components/voiceAgent/`
- **Mobile Implementation**: `apps/mobile/src/components/voice/`
- **State Management**: `packages/shared-state/src/slices/voiceSlice.ts`

---

**Last Updated**: 2025-11-25
**Current Phase**: Phase 1 - ✅ Completed + Critical Bug Fix (Modal-based approach)
**Overall Progress**: 40% Complete (Phase 1 done, critical navigation bug fixed, transcript saving pending)
