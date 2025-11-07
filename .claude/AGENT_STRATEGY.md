# Ava AI Assistant - Sub-Agent Delegation Strategy

This document defines the specialized agent structure for working on the Ava AI Assistant Electron app. Use this strategy to maintain context efficiency and leverage specialized expertise.

## ⚠️ CRITICAL: Always Use MCP Before Implementation

**MANDATORY RULE: DO NOT rely on training data alone when implementing changes!**

### Context7 MCP is REQUIRED Before:
- ✅ Any UI/styling changes (React, Tailwind CSS)
- ✅ State management updates (Redux Toolkit)
- ✅ Electron API usage (window management, IPC, native features)
- ✅ Build configuration (Webpack, Electron Forge)
- ✅ TypeScript patterns and types
- ✅ Component architecture decisions

**Why?** Training data becomes obsolete. Context7 provides current documentation from official sources. Always verify:
1. API signatures are current
2. Patterns follow latest best practices
3. Syntax is up-to-date (not deprecated)
4. No breaking changes since training cutoff

**Workflow:** Context7 consultation → Implementation → Testing

See `.claude/README.md` for detailed MCP usage rules.

---

## Overview

Instead of loading the entire codebase, we use **on-demand specialist agents** that focus on narrow domains with only the files they need. Each agent can have MCP access to official documentation for their integration domain.

---

## Integration Specialist Agents

### 1. n8n Webhook Integration Specialist
**MCP Access:** n8n official documentation
**Expertise:** Webhook protocols, request/response formats, workflow integration

**Focused Files:**
- `src/services/DatabaseSyncService.ts` (RTK Query endpoints)
- `src/services/AssistantCRUDService.ts`
- `src/services/ChatCRUDService.ts`
- `src/services/ChatHistoryCRUDService.ts`
- `src/config/webhoock.ts`
- `src/types/n8n/` (WebhookResponse.ts, SendMessageParams.ts, AssistantsWithChatsDto.ts)
- `src/hooks/useWebhoock.ts`
- `src/main.js` (IPC webhook handler, lines 278-350)

**Use Cases:**
- Modify webhook endpoints or payload structure
- Add new n8n workflow integrations
- Debug webhook response issues
- Update DTO mappings when n8n workflow changes

---

### 2. ElevenLabs Voice Agent Specialist
**MCP Access:** ElevenLabs API documentation
**Expertise:** Voice conversation SDK, audio streaming, speech-to-speech

**Focused Files:**
- `src/hooks/useVoiceAgent.ts` (conversation management)
- `src/components/voiceAgent/` (all 5 components)
- `src/hooks/useWebhoock.ts` (audio response handling)
- `package.json` (dependency: `@11labs/react`)

**Use Cases:**
- Configure voice agent settings (agent ID, API key)
- Modify conversation flow or UI
- Add new voice features (language switching, voice selection)
- Debug audio stream issues
- Update to newer ElevenLabs SDK versions

---

### 3. Electron Desktop Integration Specialist
**MCP Access:** Electron official documentation
**Expertise:** Main process, IPC, native APIs, packaging

**Focused Files:**
- `src/main.js` (window management, IPC handlers, system tray)
- `src/preload.js` (context bridge)
- `forge.config.js` (build & packaging)
- `webpack.main.config.js`
- `webpack.renderer.config.js`
- `webpack.rules.js`

**Use Cases:**
- Add new IPC channels for renderer ↔ main communication
- Modify window behavior (size, titlebar, system tray)
- Add native integrations (notifications, file system, clipboard)
- Update build configuration for new platforms
- Configure security policies (CSP, fuses)

---

### 4. Redux Toolkit State Management Specialist
**MCP Access:** Redux Toolkit documentation
**Expertise:** Slices, RTK Query, state architecture

**Focused Files:**
- `src/slices/AssistantSlice.ts`
- `src/slices/ChatSlice.ts`
- `src/slices/ChatHistorySlice.ts`
- `src/slices/UISlice.ts`
- `src/slices/UserSlice.ts`
- `src/config/storeConfig.ts`
- `src/services/DatabaseSyncService.ts` (RTK Query API)

**Use Cases:**
- Add new state slices or modify existing ones
- Create new RTK Query endpoints
- Refactor state shape or selectors
- Implement complex state logic (optimistic updates, cache invalidation)

---

## UI/Component Specialist Agents

### 5. React Component Architecture Specialist
**MCP Access:** React documentation
**Expertise:** Component patterns, hooks, lifecycle, performance

**Focused Files:** Any component file that needs architectural changes

**Use Cases:**
- Refactor components for better reusability
- Implement custom hooks
- Optimize rendering performance
- Add complex UI interactions

---

### 6. UI/Styling Specialist
**MCP Access:** Tailwind CSS documentation
**Expertise:** CSS, Tailwind, theming, visual design

**Focused Files:**
- `src/index.css` (global styles, CSS variables)
- `tailwind.config.js` (color palette, fonts, spacing)
- `src/assets/fonts/` (font files)
- `src/assets/icons/` (SVG icons, including logo2.svg)
- `src/assets/images/` (PNG/SVG images)

**Use Cases:**
- Change fonts across the app
- Update color scheme or theme
- Modify spacing, animations, shadows
- Replace logos or icons
- Adjust button styles, borders, etc.

---

### 7. Form/Modal Component Builder
**Expertise:** Forms, validation, modal interactions

**Focused Files:**
- `src/components/NewAssistantModal.tsx`
- `src/components/EditAssistantModal.tsx`
- `src/components/ChatInput.tsx`
- `src/components/RenameDialog.tsx`
- `src/components/AssignScheduledChatDialog.tsx`
- `src/components/DeleteChatConfirmationDialog.tsx`
- `src/components/AssistantDeleteConfirmDialog.tsx`
- Any modal/form components

**Use Cases:**
- Add new fields to assistant creation form
- Modify form validation logic
- Create new modals or dialogs
- Add new sections to existing forms

---

## Quality Assurance & Testing Agents

### 8. Testing & Verification Agent
**MCP Access:** Chrome DevTools MCP (for direct console access)
**Tools:** Read-only file access, `npm start`, Chrome DevTools Protocol
**Expertise:** End-to-end testing, visual QA, user flow validation, remote debugging

**Responsibilities:**
- Launch app in dev mode (`npm start`)
- **Connect via Chrome DevTools MCP** to read console directly (port 9222)
- Read browser console errors/warnings in real-time
- Take screenshots of app state
- Verify changes visually
- Test user flows (create assistant, send messages, voice conversations)
- Report discrepancies between expected vs actual behavior
- Monitor network requests (webhook calls, API responses)

**Critical Capability:**
The Testing Agent can now **autonomously verify fixes** by connecting to the Electron app via remote debugging. No more asking users to copy/paste console errors! See `REMOTE_DEBUGGING_GUIDE.md` for details.

**Context Size:** Small (read-only, no modifications)

---

### 9. Debugging & Troubleshooting Agent
**Expertise:** Error diagnosis, console analysis, network debugging

**Tools:** Read logs, grep error patterns, analyze stack traces

**Use Cases:**
- Diagnose why a feature isn't working
- Analyze console errors and stack traces
- Check network request/response issues
- Review Redux DevTools state changes
- Suggest fixes to other specialist agents

---

## Build & Configuration Agents

### 10. Build & Packaging Specialist
**MCP Access:** Webpack, Electron Forge documentation
**Expertise:** Build pipeline, bundling, optimization

**Focused Files:**
- `webpack.main.config.js`
- `webpack.renderer.config.js`
- `webpack.rules.js`
- `forge.config.js`
- `package.json` (scripts, dependencies)
- `tsconfig.json`
- `postcss.config.js`

**Use Cases:**
- Modify build process
- Add new loaders or plugins
- Optimize bundle size
- Configure platform-specific builds (Windows, macOS, Linux)
- Update dependencies

---

## Domain Specialist Agents

### 11. Audio/Media Processing Specialist
**Expertise:** Audio encoding/decoding, file handling, media streams

**Focused Files:**
- `src/utils/audioUtils.ts`
- `src/utils/Base64Converter.ts`
- `src/components/VoiceRecordingInterface.tsx`
- `src/components/VoicePlayer.tsx`
- `src/components/TelegramStyleVoiceMessage.tsx`
- `src/components/VoiceMessageTest.tsx`

**Use Cases:**
- Modify audio compression/format
- Add new media types (video processing)
- Optimize audio file handling
- Fix audio playback issues
- Implement audio waveform visualization

---

### 12. Authentication & User Management Specialist
**Expertise:** Login flow, user state, token management

**Focused Files:**
- `src/components/LoginForm.tsx`
- `src/slices/UserSlice.ts`
- Authentication-related IPC in `src/main.js`
- `src/renderer.tsx` (login state management)

**Use Cases:**
- Modify login mechanism
- Add OAuth or other auth methods
- Implement user session management
- Add multi-account support
- Handle token refresh logic

---

### 13. Notification & Messaging Specialist
**Expertise:** In-app notifications, system notifications, unread tracking

**Focused Files:**
- `src/hooks/useNotification.tsx`
- `src/hooks/useUnreadNotifications.ts`
- `src/components/NotificationContainer.tsx`
- `src/components/Notification.tsx`
- `src/components/UnreadNotification.tsx`
- `src/services/FetchUnreadMessagesService.ts`
- `src/main.js` (system notification handlers)

**Use Cases:**
- Modify notification behavior
- Add notification preferences
- Change unread message polling logic (currently 60s interval)
- Add desktop notification actions
- Customize notification UI/UX

---

## Workflow Patterns

### Pattern 1: UI Change (e.g., Change Fonts)

1. **UI/Styling Specialist**
   - Update font-face declarations in `src/index.css`
   - Modify Tailwind config font family
   - Add new font files to `src/assets/fonts/`

2. **Testing Agent**
   - Launch app
   - Verify all text uses new font
   - Check for rendering issues

---

### Pattern 2: Add Form Field (e.g., Add "category" to assistant creation)

1. **Form/Modal Component Builder**
   - Add dropdown field to `NewAssistantModal.tsx` and `EditAssistantModal.tsx`
   - Implement UI and validation

2. **State Management Specialist**
   - Update `Assistant` type in `src/types/model/Assistant.ts`
   - Modify Redux slice if needed

3. **n8n Webhook Integration Specialist**
   - Update DTO mapping in `src/types/n8n/`
   - Ensure new field is sent to backend webhook
   - Update service methods if needed

4. **Testing Agent**
   - Create an assistant with the new category field
   - Verify it saves correctly
   - Check webhook payload contains new field

---

### Pattern 3: Voice Feature Addition

1. **ElevenLabs Voice Agent Specialist** (consults ElevenLabs MCP)
   - Modify `useVoiceAgent.ts` hook
   - Update voice UI components
   - Configure new voice settings

2. **State Management Specialist** (if state changes needed)
   - Add voice preferences to Redux state

3. **Testing Agent**
   - Start voice conversation
   - Verify new feature works
   - Check for audio stream issues

---

### Pattern 4: Build/Packaging Changes

1. **Build & Packaging Specialist**
   - Modify webpack or forge configs
   - Update build scripts

2. **Electron Desktop Integration Specialist** (if Electron-specific)
   - Update app icons, splash screens
   - Modify Electron configuration

3. **Testing Agent**
   - Run `npm run package` or `npm run make`
   - Verify build completes successfully
   - Test packaged app on target platform

---

## MCP Configuration

✅ **MCP servers are configured in `.mcp.json`** at the project root.

### Configured MCP Servers

#### 1. Context7 MCP (Unified Documentation Access)
**Server:** `@upstash/context7-mcp`
**Provides:** Up-to-date documentation for React, Redux Toolkit, Electron, Webpack, and 90+ other frameworks
**Benefits:** Single source for all web technology documentation, always current with latest versions
**Authentication:** None required
**Agents using this:** React Component Architecture Specialist, Redux State Management Specialist, Electron Desktop Integration Specialist, Build & Packaging Specialist

#### 2. ElevenLabs Official MCP
**Server:** `@elevenlabs/mcp-server`
**Provides:** Text-to-Speech, voice cloning, audio transcription, conversational AI APIs
**Benefits:** Direct access to ElevenLabs platform features and documentation
**Authentication:** Requires `ELEVENLABS_API_KEY` environment variable
**Get API Key:** https://elevenlabs.io/app/settings/api-keys
**Agents using this:** ElevenLabs Voice Agent Specialist, Audio/Media Processing Specialist

#### 3. Tailwind CSS MCP
**Server:** `tailwindcss-mcp-server`
**Provides:** Tailwind utilities, CSS-to-Tailwind conversion, component templates, color palettes
**Benefits:** Dedicated Tailwind expertise, conversion tools, template generation
**Authentication:** None required
**Agents using this:** UI/Styling Specialist

#### 4. n8n Workflow MCP
**Server:** `@czlonkowski/n8n-mcp`
**Provides:** n8n workflow automation, workflow building, execution management
**Benefits:** Build and manage n8n workflows programmatically
**Authentication:** Requires `N8N_API_URL` and `N8N_API_KEY` environment variables
**Agents using this:** n8n Webhook Integration Specialist

#### 5. Chrome DevTools MCP
**Server:** `chrome-devtools-mcp`
**Provides:** Browser console access, network monitoring, screenshots, remote debugging
**Benefits:** Direct access to Electron app console for autonomous verification
**Authentication:** None required (uses local port 9222)
**Agents using this:** Testing & Verification Agent, Debugging & Troubleshooting Agent

**Critical Feature:** Enables Claude to read browser console directly without user copy/paste. The Electron app runs with `--remote-debugging-port=9222` to allow connection. See `REMOTE_DEBUGGING_GUIDE.md` for complete setup and usage.

### Setup Instructions

1. **Install dependencies** (MCP servers auto-install on first use via npx)

2. **Configure API keys** (if needed):
   ```bash
   # Copy the example environment file
   cp .env.example .env

   # Edit .env and add your API keys:
   # ELEVENLABS_API_KEY=your_key_here
   # N8N_API_URL=https://n8n-test.brandgrowthos.ai
   # N8N_API_KEY=your_n8n_key_here
   ```

3. **Verify MCP servers are loaded:**
   - Claude Code will automatically discover `.mcp.json`
   - MCP servers will be available to all agents
   - Check Claude Code logs for successful MCP connections

### API Keys Required

- **ElevenLabs API Key**: Get from https://elevenlabs.io/app/settings/api-keys (Free tier: 10k credits/month)
- **n8n API Key**: Optional, depends on your n8n instance authentication setup
- **Context7**: No API key needed
- **Tailwind CSS MCP**: No API key needed

### MCP Server Features

**Context7** can fetch documentation for:
- React, React Router, React Query
- Redux, Redux Toolkit
- Electron, Electron Forge
- Webpack, Vite, esbuild
- TypeScript, JavaScript
- Tailwind CSS
- And 80+ more libraries

**ElevenLabs MCP** provides:
- Text-to-Speech generation
- Voice cloning
- Audio transcription
- Conversational AI integration
- Voice library access

**Tailwind CSS MCP** provides:
- CSS to Tailwind class conversion
- Color palette generation
- Component template creation
- Utility documentation lookup

**n8n MCP** provides:
- Workflow creation and management
- Execution monitoring
- Integration setup
- Webhook configuration

---

## Key File Locations Reference

```
Project Root: E:\04 BGOS App\AVA-ASSISTANT-master\AVA-ASSISTANT-master

Entry Points:
├── src/main.js (Electron main process)
├── src/renderer.tsx (React root)
└── src/preload.js (IPC bridge)

Configuration:
├── package.json
├── forge.config.js (Electron Forge)
├── tailwind.config.js (Tailwind CSS)
├── webpack.main.config.js
├── webpack.renderer.config.js
├── webpack.rules.js
└── tsconfig.json

State Management:
├── src/config/storeConfig.ts
├── src/slices/ (5 Redux slices)
└── src/services/ (CRUD services, RTK Query)

Components:
├── src/components/ (30+ React components)
├── src/components/icons/ (9 assistant/brand icons)
└── src/components/voiceAgent/ (5 voice UI components)

Assets:
├── src/assets/icon.ico (app icon)
├── src/assets/fonts/ (5 font files)
├── src/assets/icons/ (20+ SVG icons, including logo2.svg)
└── src/assets/images/ (12+ PNG/SVG images)

Styling:
└── src/index.css (global styles, CSS variables)

Types:
├── src/types/model/ (TypeScript models)
└── src/types/n8n/ (webhook DTOs)

Hooks:
├── src/hooks/useWebhoock.ts (n8n webhook integration)
├── src/hooks/useVoiceAgent.ts (ElevenLabs voice)
├── src/hooks/useNotification.tsx
└── src/hooks/useUnreadNotifications.ts
```

---

## How to Use This Strategy

When Claude is asked to make changes:

1. **Identify** which specialist agent(s) are needed
2. **Delegate** tasks in proper sequence
3. **Verify** with Testing Agent
4. **Report** results

If Claude "forgets" or session resets, refer to this document to restore the agent delegation strategy.

---

## Version History

- **v1.0** (2025-01-01): Initial agent strategy defined with 13 specialized agents
- **v1.1** (2025-01-01): MCP servers configured and documented
  - Added Context7 MCP for unified documentation access
  - Added ElevenLabs official MCP for voice integration
  - Added Tailwind CSS MCP for styling expertise
  - Added n8n MCP for workflow automation
  - Created .mcp.json configuration file
  - Created .env.example for API key management
