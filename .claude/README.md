# Claude Code Project Configuration

This directory contains Claude Code-specific configuration and documentation for the Ava AI Assistant project.

## Files

- **`AGENT_STRATEGY.md`** - Complete sub-agent delegation strategy
  - Defines 13 specialized agents for working on this codebase
  - Each agent has focused file access and MCP documentation
  - Includes workflow patterns and examples
  - **READ THIS FIRST** when starting a new Claude session to restore the agent structure

- **`REMOTE_DEBUGGING_GUIDE.md`** - Chrome DevTools MCP debugging guide
  - How to monitor the Electron app console directly
  - Step-by-step remote debugging setup
  - Case study: The __dirname bug and how it was solved
  - Troubleshooting guide for common issues
  - **READ THIS if debugging the app or verifying fixes**

- **`MCP_SETUP_SUMMARY.md`** - MCP configuration reference
  - Quick overview of all configured MCP servers
  - Setup instructions and API key requirements

## Quick Start

If you're a new Claude instance working on this project:

1. Read `AGENT_STRATEGY.md` to understand the 13-agent specialization framework
2. **⚠️ ALWAYS use MCP servers (especially Context7) before implementing changes** (see below)
3. When the user requests changes, identify which specialist agent(s) are needed
4. Use the Task tool to invoke agents with focused context
5. Follow the workflow patterns defined in the strategy document

## ⚠️ CRITICAL: Always Use MCP Before Implementation

**DO NOT rely on training data alone!** Claude's training data can be obsolete. **ALWAYS consult MCP servers before making changes.**

### MCP Usage Rules

#### 1. Context7 MCP - REQUIRED for ALL technical changes
**Use Context7 BEFORE implementing:**
- ✅ Any UI/styling changes (React, Tailwind CSS)
- ✅ State management updates (Redux Toolkit)
- ✅ Electron API usage (window management, IPC, native features)
- ✅ Build configuration (Webpack, Electron Forge)
- ✅ TypeScript patterns and types
- ✅ Component architecture decisions

**Why?** Context7 provides up-to-date documentation from official sources. Your training data may use deprecated APIs, old patterns, or outdated syntax.

**How to use:**
- Ask Context7 for current best practices BEFORE writing code
- Verify API signatures are current
- Check for breaking changes since training cutoff
- Confirm syntax and patterns are up-to-date

#### 2. Tailwind CSS MCP - Use for styling
**Consult Tailwind MCP for:**
- CSS to Tailwind class conversion
- Color palette generation
- Utility class lookups
- Component styling patterns

#### 3. ElevenLabs MCP - Use for voice features
**Consult ElevenLabs MCP when working with:**
- Voice conversation features
- Audio transcription
- TTS configuration
- Voice cloning

#### 4. n8n MCP - Use for webhooks
**Consult n8n MCP when modifying:**
- Webhook integrations
- Workflow automation
- n8n API calls

### Example: Wrong vs Right Approach

❌ **WRONG:**
```
User: "Add a new React component with hooks"
Claude: *Writes component based on training data*
Result: Uses deprecated patterns, old hook syntax, outdated best practices
```

✅ **RIGHT:**
```
User: "Add a new React component with hooks"
Claude: *Consults Context7 MCP for React 19 hooks documentation*
Claude: *Writes component using current best practices*
Result: Modern, up-to-date, follows latest patterns
```

### MCP Configuration

MCP servers are configured in `.mcp.json` at project root:
- ✅ Context7 - Ready to use (no API key needed)
- ✅ Tailwind CSS MCP - Ready to use (no API key needed)
- ⚠️ ElevenLabs MCP - Requires API key in `.env`
- ⚠️ n8n MCP - Requires API key in `.env`

See `MCP_SETUP_SUMMARY.md` for full configuration details.

## Agent Categories

- **Integration Specialists** (4): n8n, ElevenLabs, Electron, Redux
- **UI/Component Specialists** (3): React Architecture, UI/Styling, Form/Modal Builder
- **QA Agents** (2): Testing & Verification, Debugging
- **Build Specialist** (1): Build & Packaging
- **Domain Specialists** (3): Audio/Media, Authentication, Notifications

## Philosophy

**Context Efficiency**: Each agent loads <10 files instead of entire codebase
**Specialization**: Agents become experts in their domain with MCP access to official docs
**Quality**: Testing Agent verifies all changes before completion
**Workflow**: Clear handoffs between agents (Component → State → Integration → Testing)

---

For full details, see `AGENT_STRATEGY.md`
