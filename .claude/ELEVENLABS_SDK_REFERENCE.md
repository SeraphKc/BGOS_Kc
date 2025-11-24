# ElevenLabs Voice Agent SDK - Complete Reference Guide

> **Last Updated:** 2025-11-22
> **SDK Version:** @elevenlabs/react-native v0.3.2
> **Documentation Source:** Official ElevenLabs Agents Platform Documentation

---

## Table of Contents

1. [Quick Reference - Key Methods Explained](#quick-reference---key-methods-explained)
2. [Installation & Setup](#installation--setup)
3. [Complete API Reference](#complete-api-reference)
4. [Event Callbacks](#event-callbacks)
5. [API Endpoints](#api-endpoints)
6. [Authentication](#authentication)
7. [Configuration Options](#configuration-options)
8. [Implementation Patterns](#implementation-patterns)
9. [Client Tools](#client-tools)
10. [Dynamic Variables](#dynamic-variables)
11. [Knowledge Base & RAG](#knowledge-base--rag)
12. [Best Practices](#best-practices)
13. [Platform-Specific Setup](#platform-specific-setup)
14. [LiveKit Integration](#livekit-integration)
15. [Error Handling](#error-handling)
16. [Performance Optimization](#performance-optimization)

---

## Quick Reference - Key Methods Explained

### Three Critical Communication Methods

| Method | Purpose | Agent Response | When to Use |
|--------|---------|----------------|-------------|
| **`sendUserMessage(text)`** | Send explicit message | ✅ **Triggers verbal response** | User explicitly sends text during voice call |
| **`sendContextualUpdate(text)`** | Add silent context | ❌ **No response** (silent ingestion) | Update background state/context without interrupting |
| **`sendUserActivity()`** | Signal "user is busy" | ⏸️ **Pauses ~2 seconds** | Prevent agent from interrupting UI interactions |

### `sendContextualUpdate()` - Deep Dive

**What it does:**
Sends text-based context to the agent during an active voice conversation **WITHOUT triggering a verbal response**.

**Real-World Examples:**

```javascript
// Example 1: User browsing products during voice conversation
onProductView = (product) => {
  conversation.sendContextualUpdate(
    `User is viewing: ${product.name}, Price: $${product.price}, Stock: ${product.stock}`
  );
  // Agent now knows this for future responses, but won't interrupt to announce it
};

// Example 2: Location change
onLocationUpdate = (location) => {
  conversation.sendContextualUpdate(
    `User current location: ${location.city}, ${location.state}`
  );
};

// Example 3: Cart updates
onCartChange = (cart) => {
  conversation.sendContextualUpdate(
    `Shopping cart updated: ${cart.itemCount} items, Total: $${cart.total}`
  );
};

// Example 4: App state changes
onSettingChange = (setting, value) => {
  conversation.sendContextualUpdate(
    `User changed ${setting} to ${value}`
  );
};
```

**Think of it as:** Whispering additional context into the agent's ear without interrupting the conversation flow.

---

### `sendUserActivity()` - Deep Dive

**What it does:**
Signals to the agent that the user is actively interacting with the app, creating a **~2-second pause** where the agent won't start speaking.

**What "user activity" means:**
- ✅ User is **typing** in a text field
- ✅ User is **clicking/tapping** buttons or UI elements
- ✅ User is **scrolling** through content
- ✅ User is **browsing** product pages
- ✅ User is **selecting** options in a form
- ❌ **NOT** about playing sounds or audio

**Real-World Examples:**

```javascript
// Example 1: Text input focus
<TextInput
  onFocus={() => {
    conversation.sendUserActivity(); // Agent pauses while user types
  }}
  onChange={() => {
    conversation.sendUserActivity(); // Continuous pause during typing
  }}
/>

// Example 2: Button interactions
<Button
  onPress={() => {
    conversation.sendUserActivity(); // Prevents agent from talking over interaction
    handleAction();
  }}
>
  Submit
</Button>

// Example 3: Scrolling through list
<ScrollView
  onScroll={() => {
    conversation.sendUserActivity(); // Agent waits while user browses
  }}
>
  {items.map(item => <Item key={item.id} {...item} />)}
</ScrollView>

// Example 4: Form filling
onInputChange = () => {
  // Call this on every input change
  conversation.sendUserActivity();
  // Agent won't interrupt while user is filling out form
};
```

**Why this matters:**
Without this signal, the agent might start talking while the user is mid-interaction, creating a jarring UX. This method ensures smooth, non-interruptive conversations.

---

### Method Comparison with Examples

```javascript
// Scenario: User is shopping and asks "What deals do you have?"

// ❌ WRONG: Using sendUserMessage for background updates
conversation.sendUserMessage("User is viewing Product X");
// Result: Agent responds "I see you're viewing Product X..." (interrupting flow)

// ✅ CORRECT: Using sendContextualUpdate for background updates
conversation.sendContextualUpdate("User is viewing Product X");
// Result: Agent knows context but doesn't announce it

// Later, when agent recommends products:
// Agent: "Based on what you're looking at, I'd recommend..."
```

```javascript
// Scenario: User starts typing while agent is about to respond

// ❌ WITHOUT sendUserActivity:
// Agent starts talking while user is typing → bad UX

// ✅ WITH sendUserActivity:
onTextInputFocus = () => {
  conversation.sendUserActivity(); // Agent pauses ~2 seconds
};
// Result: Agent waits for user to finish interacting
```

---

## Installation & Setup

### NPM Installation

```bash
npm install @elevenlabs/react-native @livekit/react-native @livekit/react-native-webrtc livekit-client
```

**If you encounter peer dependency warnings:**

Create `.npmrc` file in project root:
```
legacy-peer-deps=true
```

### Package Details

- **Package Name:** `@elevenlabs/react-native`
- **Latest Version:** v0.3.2
- **NPM Registry:** https://www.npmjs.com/package/@elevenlabs/react-native

### Framework Requirements

- ✅ **Expo Framework** (designed specifically for Expo)
- ✅ **Development Builds** required
- ❌ **NOT compatible with Expo Go** (due to native module dependencies)
- ✅ **React Native** via Expo

### Provider Setup

```typescript
import { ElevenLabsProvider } from '@elevenlabs/react-native';

function App() {
  return (
    <ElevenLabsProvider>
      <YourAppComponents />
    </ElevenLabsProvider>
  );
}

export default App;
```

### Hook Initialization

```typescript
import { useConversation } from '@elevenlabs/react-native';

function ChatComponent() {
  const conversation = useConversation({
    onConnect: ({ conversationId }) => {
      console.log('Connected:', conversationId);
    },
    onDisconnect: (details) => {
      console.log('Disconnected:', details.reason);
    },
    onMessage: ({ message, source }) => {
      console.log(`${source}: ${message}`);
    },
    onError: (message, context) => {
      console.error('Error:', message, context);
    },
    onStatusChange: ({ status }) => {
      console.log('Status:', status);
    }
  });

  return <YourUI />;
}
```

---

## Complete API Reference

### useConversation Hook - All Methods

#### Session Management

**`startSession(config)`**

Initiates WebRTC connection and requests microphone access.

```typescript
await conversation.startSession({
  // OPTION 1: Public Agent
  agentId: 'your_public_agent_id',

  // OPTION 2: Private Agent
  conversationToken: 'token_from_backend',

  // Optional Parameters
  userId: 'user_123',
  dynamicVariables: {
    user_name: 'John Doe',
    account_type: 'premium'
  },

  // Advanced Options
  serverUrl: 'wss://custom-livekit-server.com',
  tokenFetchUrl: 'https://your-backend.com/get-token'
});
```

**Parameters:**
- `agentId` (string, optional): Required for public agents
- `conversationToken` (string, optional): Required for private agents (10-minute validity)
- `userId` (string, optional): Custom user identifier for tracking
- `dynamicVariables` (object, optional): Key-value pairs for personalization
- `serverUrl` (string, optional): Override default LiveKit server
- `tokenFetchUrl` (string, optional): Override default token endpoint

**`endSession()`**

Manually terminates the active conversation.

```typescript
conversation.endSession();
```

- Disconnects WebRTC connection
- Releases microphone access
- Triggers `onDisconnect` callback

**`getId()`**

Returns the current conversation identifier.

```typescript
const conversationId = conversation.getId();
console.log('Current conversation:', conversationId);
```

#### Communication Methods

**`sendUserMessage(text: string)`**

Sends a text message to the agent during active conversation.

```typescript
conversation.sendUserMessage('Hello, I need help with my order');
```

- ✅ **Triggers agent verbal response**
- Use when user explicitly sends text
- Agent will respond as if user spoke the message

**`sendContextualUpdate(text: string)`**

Sends contextual information to agent without triggering response.

```typescript
conversation.sendContextualUpdate('User is viewing Product ID: 12345');
```

- ❌ **Does NOT trigger verbal response**
- Agent ingests and remembers context
- Use for background state updates
- See [Quick Reference](#quick-reference---key-methods-explained) for detailed examples

**`sendUserActivity()`**

Notifies agent about user activity, creating ~2-second pause.

```typescript
conversation.sendUserActivity();
```

- ⏸️ **Pauses agent for ~2 seconds**
- Prevents agent from interrupting UI interactions
- Call during typing, clicking, scrolling
- See [Quick Reference](#quick-reference---key-methods-explained) for detailed examples

#### Feedback & Control

**`sendFeedback(liked: boolean)`**

Submits binary feedback for conversation quality.

```typescript
// Positive feedback
conversation.sendFeedback(true);

// Negative feedback
conversation.sendFeedback(false);
```

- Only available when `canSendFeedback` is true
- Used for conversation quality tracking

**`setMicMuted(muted: boolean)`**

Controls microphone mute state.

```typescript
// Mute microphone
conversation.setMicMuted(true);

// Unmute microphone
conversation.setMicMuted(false);
```

---

### useConversation Hook - Properties

**`status: string`**

Current connection status.

```typescript
const { status } = conversation;

// Possible values:
// - "disconnected"
// - "connecting"
// - "connected"
// - "disconnecting"
```

**`isSpeaking: boolean`**

Indicates if agent is currently speaking.

```typescript
const { isSpeaking } = conversation;

// Use for UI indicators
{isSpeaking && <SpeakingIndicator />}
```

**`canSendFeedback: boolean`**

Indicates if feedback can be submitted.

```typescript
const { canSendFeedback } = conversation;

// Show feedback buttons only when available
{canSendFeedback && (
  <FeedbackButtons onFeedback={conversation.sendFeedback} />
)}
```

**`conversationId: string`**

Current conversation identifier.

```typescript
const { conversationId } = conversation;
console.log('Active conversation:', conversationId);
```

---

## Event Callbacks

### All 15 Available Callbacks

#### 1. `onConnect`

Called when WebRTC connection is successfully established.

```typescript
onConnect: ({ conversationId }) => {
  console.log('Connected to conversation:', conversationId);
  // Initialize UI, start recording, etc.
}
```

**Payload:**
- `conversationId` (string): Unique conversation identifier

---

#### 2. `onDisconnect`

Called when conversation ends.

```typescript
onDisconnect: (details) => {
  console.log('Disconnected. Reason:', details.reason);
  // Clean up, save conversation, etc.
}
```

**Payload:**
- `reason` (string): `"user"` | `"agent"` | `"error"`

---

#### 3. `onStatusChange`

Called when connection status changes.

```typescript
onStatusChange: ({ status }) => {
  console.log('Status changed to:', status);
  setConnectionStatus(status);
}
```

**Payload:**
- `status` (string): `"disconnected"` | `"connecting"` | `"connected"` | `"disconnecting"`

---

#### 4. `onMessage`

Called when messages are received (transcriptions, LLM replies).

```typescript
onMessage: ({ message, source }) => {
  console.log(`${source}: ${message}`);
  addToTranscript({ message, source });
}
```

**Payload:**
- `message` (string): Text content
- `source` (string): `"user"` | `"agent"`

---

#### 5. `onError`

Called when errors occur.

```typescript
onError: (message, context) => {
  console.error('Error:', message);
  console.error('Context:', context);
  showErrorNotification(message);
}
```

**Payload:**
- `message` (string): Error description
- `context` (any, optional): Additional error context

---

#### 6. `onModeChange`

Tracks agent speaking/listening state.

```typescript
onModeChange: ({ mode }) => {
  console.log('Mode changed to:', mode);
  // Update UI to show "Listening" or "Speaking"
}
```

**Payload:**
- `mode` (string): Agent's current mode

---

#### 7. `onCanSendFeedbackChange`

Tracks feedback availability changes.

```typescript
onCanSendFeedbackChange: (canSend) => {
  console.log('Can send feedback:', canSend);
  setFeedbackEnabled(canSend);
}
```

**Payload:**
- `canSend` (boolean): Feedback availability

---

#### 8. `onUnhandledClientToolCall`

Manages unhandled client tool invocations.

```typescript
onUnhandledClientToolCall: (toolCall) => {
  console.log('Unhandled tool call:', toolCall);
  // Handle tool calls not registered in clientTools
}
```

**Payload:**
- `toolCall` (object): Tool call details

---

#### 9. `onAudio`

Receives base64-encoded audio chunks.

```typescript
onAudio: (audioChunk) => {
  console.log('Received audio chunk:', audioChunk.substring(0, 50));
  // Process raw audio data
}
```

**Payload:**
- `audioChunk` (string): Base64-encoded audio

---

#### 10. `onVadScore`

Voice activity detection scores.

```typescript
onVadScore: (score) => {
  console.log('VAD score:', score);
  // Use for visualizations or analytics
}
```

**Payload:**
- `score` (number): Voice activity detection score

---

#### 11. `onInterruption`

Called when user interrupts agent.

```typescript
onInterruption: () => {
  console.log('User interrupted agent');
  // Handle interruption (e.g., visual feedback)
}
```

---

#### 12. `onAgentChatResponsePart`

Receives partial agent responses as they stream.

```typescript
onAgentChatResponsePart: (part) => {
  console.log('Response part:', part);
  // Show streaming text in UI
  appendToStreamingResponse(part);
}
```

**Payload:**
- `part` (string): Partial response text

---

#### 13. `onMCPToolCall`

Model Context Protocol tool calls.

```typescript
onMCPToolCall: (toolCall) => {
  console.log('MCP tool call:', toolCall);
  // Handle MCP-specific tool invocations
}
```

**Payload:**
- `toolCall` (object): MCP tool call details

---

#### 14. `onMCPConnectionStatus`

MCP connection status updates.

```typescript
onMCPConnectionStatus: (status) => {
  console.log('MCP connection status:', status);
  // Track MCP server connectivity
}
```

**Payload:**
- `status` (string): MCP connection status

---

#### 15. `onIsSpeakingChange` (Derived from `isSpeaking` property)

Though not explicitly an event, you can track `isSpeaking` changes:

```typescript
const { isSpeaking } = conversation;

useEffect(() => {
  console.log('Agent speaking state:', isSpeaking);
  // Update UI indicators
}, [isSpeaking]);
```

---

### Event Configuration Note

⚠️ **IMPORTANT:** Not all events are enabled by default. Enable specific events in the **"Advanced"** tab of agent settings in the ElevenLabs dashboard.

---

## API Endpoints

### Base URL
```
https://api.elevenlabs.io
```

### Agents Management

**Create Agent**
```
POST /v1/convai/agents/create
```

**List Agents**
```
GET /v1/convai/agents
```

**Get Agent Details**
```
GET /v1/convai/agents/:agent_id
```

**Update Agent**
```
PATCH /v1/convai/agents/:agent_id
```

**Delete Agent**
```
DELETE /v1/convai/agents/:agent_id
```

---

### Conversations

**Get WebRTC Session Token** (Critical for React Native)
```
GET /v1/convai/conversation/token?agent_id={id}
```

Headers:
```
xi-api-key: YOUR_API_KEY
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**List Conversations**
```
GET /v1/convai/conversations
```

**Get Conversation Details**
```
GET /v1/convai/conversations/:conversation_id
```

Response includes:
- `agent_id`
- `conversation_id`
- `status`
- `transcript` (full conversation)
- `metadata`
- `analysis` (success evaluation, data collection)
- `audio` (audio file information)

---

### Additional Endpoints

- **Tools Management:** Create, update, delete, and list tools
- **Knowledge Base:** Manage documents and RAG configuration
- **Tests:** List test invocations
- **Phone Numbers:** Manage phone number configurations
- **Widget:** Widget integration and customization
- **Workspace:** Workspace management
- **SIP Trunk & Twilio:** Configure telephony integrations
- **Batch Calling:** Programmatic bulk call operations
- **LLM Usage:** Track language model usage and costs
- **MCP Servers:** Update MCP server configurations
- **Dashboard Settings:** Custom chart configurations

---

## Authentication

### Method 1: Public Agents (Client-Side)

```typescript
await conversation.startSession({
  agentId: 'your_public_agent_id'
});
```

- Simple and direct
- Agent must be set to "Public" in dashboard
- No server-side token generation needed

---

### Method 2: Private Agents (Server-Side Token)

**Backend (Node.js example):**

```javascript
// Server-side endpoint
app.get('/api/get-conversation-token', async (req, res) => {
  const agentId = 'your_private_agent_id';

  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
    {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      }
    }
  );

  const { token } = await response.json();

  res.json({ token });
});
```

**Client (React Native):**

```typescript
// Fetch token from your backend
const response = await fetch('https://your-backend.com/api/get-conversation-token');
const { token } = await response.json();

// Use token to start session
await conversation.startSession({
  conversationToken: token
});
```

**Important:**
- Tokens expire in **10 minutes**
- Generate fresh tokens for each session
- Never expose API keys client-side

---

### API Key Authentication

**Header Format:**
```
xi-api-key: YOUR_API_KEY
```

**Obtain API Key:**
1. Log in to ElevenLabs dashboard
2. Navigate to API settings
3. Generate or copy API key

**Security Best Practices:**
- ❌ Never expose API keys in client-side code
- ✅ Store API keys in environment variables
- ✅ Use server-side token generation for production
- ✅ Rotate API keys regularly

---

### Signed URLs (WebSocket Alternative)

Generate temporary authenticated URLs (15-minute expiry):

```javascript
// Server-side generation
const signedUrl = await generateSignedUrl(agentId);
// Send to client
```

- Prevents client-side API key exposure
- Used for WebSocket connections
- 15-minute expiration for security

---

## Configuration Options

### Agent Configuration Structure

```typescript
{
  // Core Configuration
  name: string,
  tags: string[],

  // Conversation Configuration
  conversation_config: {
    // ASR (Speech Recognition) Settings
    asr: {
      quality: "low" | "high",
      provider: string,
      audio_format: "pcm" | "ulaw",
      keywords: string[]  // Optimize recognition for specific keywords
    },

    // TTS (Text-to-Speech) Settings
    tts: {
      model: "turbo" | "flash" | "multilingual",
      voice_id: string,
      stability: number,  // 0-1 (voice consistency)
      speed: number,      // 0.5-2.0 (speaking speed)
      optimize_streaming_latency: number  // 0-4
    },

    // Turn Management
    turn_timeout_ms: number,              // Max time agent waits for user
    initial_wait_time_ms: number,         // Initial silence before agent speaks
    silence_detection_ms: number,         // Silence threshold for turn-taking
    soft_timeout_message: string,         // Message when approaching timeout

    // Agent Configuration
    first_message: string,                // Greeting message
    language: string,                     // 31 languages supported
    dynamic_variables: object,            // Runtime variables
    interruption_settings: object,        // How agent handles interruptions

    // Conversation Limits
    text_only_mode: boolean,              // Disable voice, text only
    max_duration_minutes: number          // Max conversation length
  },

  // Workflow (Node-based conversation structure)
  workflow: {
    nodes: Array<WorkflowNode>,
    edges: Array<WorkflowEdge>
  },

  // Platform Settings
  platform_settings: {
    widget: object,
    evaluation: object,
    auth: {
      enable_auth: boolean,
      allowlist: string[]  // Up to 10 domains
    },
    privacy: {
      data_retention_days: number
    }
  }
}
```

---

### LLM Models Supported

**OpenAI:**
- GPT-4o
- GPT-4o Mini
- GPT-4 Turbo
- GPT-3.5 Turbo

**Anthropic:**
- Claude 3.7 Sonnet
- Claude 3.5 Sonnet
- Claude 3 Haiku

**Google:**
- Gemini 2.0 Flash
- Gemini 1.5 Flash
- Gemini 1.5 Pro
- Gemini 1.0 Pro

**Custom LLM Integration:**
- Bring your own OpenAI API key
- Run custom LLM server (must align with OpenAI chat completion API structure)

**LLM Configuration Options:**
- Temperature control (randomness)
- Backup LLM fallback chain
- Maximum system prompt size: 2MB

**Selection Guide:**
- **Complex tasks:** GPT-4, Claude 3.7 Sonnet, Gemini 2.5
- **Real-time/latency-critical:** Gemini Flash, Claude Haiku, GPT-4o-mini
- **Tool usage:** GPT-4o mini or Claude 3.5 Sonnet
- **Avoid:** Gemini 1.5 Flash for tool-heavy scenarios

---

### TTS Models & Voices

**Models:**

| Model | Latency | Use Case |
|-------|---------|----------|
| **Eleven Turbo v2.5** | Medium | Balanced quality and speed |
| **Flash v2.5** | **75ms** | Ultra-low latency (135ms end-to-end TTFB) |
| **Multilingual** | Higher | Highest quality, 31 languages |

**Voice Configuration:**
- 5000+ voices available
- 31 languages supported
- Multi-voice support (dynamic voice switching)
- Voice types (speed priority): Default > Synthetic > Instant Voice Clones

**Parameters:**
- **Stability:** 0-1 (voice consistency vs. expressiveness)
- **Speed:** 0.5-2.0 (speaking rate)
- **Optimize Streaming Latency:** 0-4 (lower = faster, less stable)

---

### ASR (Speech Recognition)

**Models:**

| Model | Languages | Latency |
|-------|-----------|---------|
| **Scribe v1** | 99 languages | Standard |
| **Scribe v2 Realtime** | 92 languages | **150ms** |

**Supported Languages:** Afrikaans, Arabic, Chinese (Mandarin/Cantonese), English, French, German, Hindi, Japanese, Korean, Spanish, and 80+ more

**Configuration:**
- Quality level selection (low/high)
- Provider selection
- Audio format (PCM/ulaw)
- Keyword optimization (improve recognition for specific terms)

---

## Implementation Patterns

### Complete React Native Example

```typescript
import React, { useState, useEffect } from 'react';
import { View, Button, Text, TextInput, ScrollView, StyleSheet } from 'react-native';
import { ElevenLabsProvider, useConversation } from '@elevenlabs/react-native';

// Main App with Provider
function App() {
  return (
    <ElevenLabsProvider>
      <ConversationScreen />
    </ElevenLabsProvider>
  );
}

// Conversation Screen Component
function ConversationScreen() {
  const [transcript, setTranscript] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [agentId] = useState('your_agent_id_here');

  const conversation = useConversation({
    // Connection Events
    onConnect: ({ conversationId }) => {
      console.log('✅ Connected:', conversationId);
      addSystemMessage('Connected to agent');
    },

    onDisconnect: ({ reason }) => {
      console.log('❌ Disconnected:', reason);
      addSystemMessage(`Disconnected: ${reason}`);
    },

    onStatusChange: ({ status }) => {
      console.log('📊 Status:', status);
    },

    // Message Events
    onMessage: ({ message, source }) => {
      setTranscript(prev => [...prev, {
        id: Date.now(),
        message,
        source,
        timestamp: new Date()
      }]);
    },

    onAgentChatResponsePart: (part) => {
      console.log('💬 Streaming response:', part);
      // Show partial responses in real-time
    },

    // Error Handling
    onError: (message, context) => {
      console.error('❌ Error:', message, context);
      addSystemMessage(`Error: ${message}`);
    },

    // Mode & State
    onModeChange: ({ mode }) => {
      console.log('🎙️ Mode:', mode);
    },

    onInterruption: () => {
      console.log('⚠️ User interrupted agent');
    },

    // Feedback
    onCanSendFeedbackChange: (canSend) => {
      console.log('⭐ Can send feedback:', canSend);
    }
  });

  // Helper function
  const addSystemMessage = (message) => {
    setTranscript(prev => [...prev, {
      id: Date.now(),
      message,
      source: 'system',
      timestamp: new Date()
    }]);
  };

  // Start conversation
  const handleStart = async () => {
    try {
      await conversation.startSession({
        agentId,
        userId: 'user_123',
        dynamicVariables: {
          user_name: 'John Doe',
          account_type: 'premium'
        }
      });
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  // End conversation
  const handleEnd = () => {
    conversation.endSession();
  };

  // Send text message
  const handleSendText = () => {
    if (userInput.trim()) {
      conversation.sendUserMessage(userInput);
      setUserInput('');
    }
  };

  // Send contextual update (silent)
  const handleContextUpdate = (context) => {
    conversation.sendContextualUpdate(context);
    addSystemMessage(`📝 Context updated: ${context}`);
  };

  // Handle feedback
  const handleFeedback = (liked) => {
    conversation.sendFeedback(liked);
    addSystemMessage(liked ? '👍 Positive feedback sent' : '👎 Negative feedback sent');
  };

  // Toggle mute
  const handleToggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    conversation.setMicMuted(newMuteState);
  };

  return (
    <View style={styles.container}>
      {/* Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          Status: {conversation.status}
        </Text>
        <Text style={styles.statusText}>
          Agent Speaking: {conversation.isSpeaking ? '🔊' : '🔇'}
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Button
          title="Start Conversation"
          onPress={handleStart}
          disabled={conversation.status === 'connected'}
        />
        <Button
          title="End Conversation"
          onPress={handleEnd}
          disabled={conversation.status !== 'connected'}
        />
        <Button
          title={isMuted ? 'Unmute' : 'Mute'}
          onPress={handleToggleMute}
          disabled={conversation.status !== 'connected'}
        />
      </View>

      {/* Transcript */}
      <ScrollView style={styles.transcript}>
        {transcript.map((item) => (
          <View
            key={item.id}
            style={[
              styles.message,
              item.source === 'user' ? styles.userMessage :
              item.source === 'agent' ? styles.agentMessage :
              styles.systemMessage
            ]}
          >
            <Text style={styles.messageSource}>
              {item.source.toUpperCase()}
            </Text>
            <Text style={styles.messageText}>{item.message}</Text>
            <Text style={styles.timestamp}>
              {item.timestamp.toLocaleTimeString()}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Text Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={userInput}
          onChangeText={setUserInput}
          onFocus={() => conversation.sendUserActivity()}
          onChange={() => conversation.sendUserActivity()}
          placeholder="Type a message..."
          editable={conversation.status === 'connected'}
        />
        <Button
          title="Send"
          onPress={handleSendText}
          disabled={!userInput.trim() || conversation.status !== 'connected'}
        />
      </View>

      {/* Context Update Examples */}
      <View style={styles.contextButtons}>
        <Button
          title="Update Location"
          onPress={() => handleContextUpdate('User location: New York')}
        />
        <Button
          title="Update Cart"
          onPress={() => handleContextUpdate('Cart: 3 items, $99.99')}
        />
      </View>

      {/* Feedback Buttons */}
      {conversation.canSendFeedback && (
        <View style={styles.feedbackButtons}>
          <Button
            title="👍 Good"
            onPress={() => handleFeedback(true)}
          />
          <Button
            title="👎 Bad"
            onPress={() => handleFeedback(false)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  transcript: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  message: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  userMessage: {
    backgroundColor: '#e3f2fd',
    alignSelf: 'flex-end',
  },
  agentMessage: {
    backgroundColor: '#f3e5f5',
    alignSelf: 'flex-start',
  },
  systemMessage: {
    backgroundColor: '#fff3e0',
    alignSelf: 'center',
  },
  messageSource: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
  },
  timestamp: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
  },
  contextButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  feedbackButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});

export default App;
```

---

## Client Tools

### What are Client Tools?

Client tools are **JavaScript functions** executed on the client-side during conversations. They allow the agent to trigger app functionality directly.

### Configuration

**1. Define in Dashboard:**
- Navigate to agent settings → Tools
- Add new tool
- Set type to "Client"
- Define name, description, parameters

**2. Register in Code:**

```typescript
const conversation = await Conversation.startSession({
  agentId: 'your_agent_id',
  clientTools: {
    // Tool 1: Show product details
    showProductDetails: async ({ productId }) => {
      console.log('Showing product:', productId);
      navigation.navigate('ProductDetails', { id: productId });
      // Optional: Return response if "Wait for response" is enabled
      return `Navigated to product ${productId}`;
    },

    // Tool 2: Add to cart
    addToCart: async ({ productId, quantity }) => {
      console.log('Adding to cart:', productId, quantity);
      await cartService.addItem(productId, quantity);
      const cartTotal = await cartService.getTotal();
      return `Added ${quantity}x product ${productId}. Cart total: $${cartTotal}`;
    },

    // Tool 3: Search products
    searchProducts: async ({ query }) => {
      console.log('Searching for:', query);
      const results = await productService.search(query);
      return `Found ${results.length} products for "${query}"`;
    },

    // Tool 4: Get user location
    getUserLocation: async () => {
      const location = await Location.getCurrentPositionAsync();
      return `User location: ${location.coords.latitude}, ${location.coords.longitude}`;
    }
  }
});
```

### Handling Unregistered Tools

```typescript
const conversation = useConversation({
  onUnhandledClientToolCall: (toolCall) => {
    console.log('Unhandled tool call:', toolCall);
    // Fallback handling or error notification
  }
});
```

### Best Practices

1. **Use descriptive names** - Avoid abbreviations
   - ✅ `showProductDetails`
   - ❌ `showProdDtls`

2. **Provide detailed descriptions** in dashboard
   - Example: "Displays detailed information about a specific product, including price, images, and reviews"

3. **Use high-intelligence LLMs** (GPT-4o mini, Claude 3.5 Sonnet) for better tool selection

4. **Enable "Wait for response"** when agent needs return values

5. **Include format guidance** in parameter descriptions
   - Example: "productId (string): The unique identifier for the product (format: PROD-12345)"

---

## Dynamic Variables

### What are Dynamic Variables?

Dynamic variables allow you to personalize agent conversations with runtime data.

### Syntax

```
{{variable_name}}
```

### Variable Types
- **String**
- **Number**
- **Boolean**

### Implementation

```typescript
await conversation.startSession({
  agentId: 'your_agent_id',
  dynamicVariables: {
    // User information
    user_name: 'John Doe',
    user_id: '12345',
    user_email: 'john@example.com',

    // Account details
    account_type: 'premium',
    subscription_expires: '2025-12-31',
    credits_remaining: 100,

    // Context
    current_page: 'product_details',
    last_purchase: 'Laptop',
    cart_total: 299.99,

    // Preferences
    language: 'en',
    timezone: 'America/New_York',
    notifications_enabled: true
  }
});
```

### Usage in Agent Prompts

**Agent System Prompt:**
```
You are a helpful shopping assistant for {{user_name}}.
Their account type is {{account_type}}.
They have {{credits_remaining}} credits remaining.
Their last purchase was: {{last_purchase}}.
```

**First Message:**
```
Hello {{user_name}}, welcome back! How can I help you today?
```

### System Variables (Auto-Available)

These are automatically available without explicit definition:

- `{{system__agent_id}}` / `{{system__current_agent_id}}`
- `{{system__caller_id}}` / `{{system__called_number}}`
- `{{system__call_duration_secs}}`
- `{{system__time_utc}}` / `{{system__time}}`
- `{{system__conversation_id}}`
- `{{system__call_sid}}` (Twilio)

### Secret Variables

Prefix with `secret__` for sensitive data:

```typescript
dynamicVariables: {
  secret__api_token: 'sensitive_token_value',
  secret__user_auth: 'private_identifier',
  secret__payment_key: 'pk_live_xxx'
}
```

**Security:**
- Secret variables are NEVER sent to LLM providers
- Only used in headers/authentication
- Not visible in transcripts

### URL Integration

**Method 1 - Base64 JSON:**
```
https://elevenlabs.io/app/talk-to?agent_id=xxx&vars=eyJ1c2VyX25hbWUiOiJKb2huIn0=
```

**Method 2 - Query Parameters:**
```
https://elevenlabs.io/app/talk-to?agent_id=xxx&var_user_name=John&var_account=premium
```

### Tool-Based Updates

Tool responses can update dynamic variables using JSON path notation:

```typescript
// Tool returns:
{
  "users": [
    { "email": "john@example.com" }
  ]
}

// Access in agent prompt:
// response.users.0.email → "john@example.com"
```

---

## Knowledge Base & RAG

### What is RAG?

Retrieval-Augmented Generation (RAG) enables agents to access large knowledge bases efficiently without loading entire documents into context.

### How It Works

1. Documents are uploaded to Knowledge Base
2. Documents are indexed (vectorized)
3. During conversation, relevant chunks are retrieved based on query
4. Retrieved chunks are added to LLM context
5. Agent responds with knowledge-enhanced answer

### Configuration

**1. Enable RAG in Dashboard:**
- Navigate to agent settings → Knowledge Base
- Toggle "Use RAG" option
- Add documents (must be indexed before use)

**2. Upload Documents:**
- Minimum document size: 500 bytes
- Supported formats: TXT, PDF, DOCX, etc.
- Workspace limits based on subscription tier

**3. Configure Parameters:**
- **Vector distance threshold**: Relevance cutoff (lower = stricter)
- **Number of chunks to retrieve**: How many passages to include (affects cost)
- **Embedding model**: Model used for vectorization

### Performance

- **Added Latency:** ~500ms per query
- **Cost Impact:** Increased LLM usage (more context)

### Best Practices

1. **Balance chunk count vs. cost**
   - More chunks = better coverage but higher LLM cost
   - Start with 3-5 chunks, adjust based on performance

2. **Adjust vector distance for relevance**
   - Lower threshold = only highly relevant chunks
   - Higher threshold = broader coverage

3. **Optimize document structure**
   - Use clear headings and sections
   - Break large documents into logical chunks
   - Include metadata for better retrieval

4. **Monitor performance**
   - Track latency impact
   - Analyze retrieval accuracy
   - Adjust parameters based on user feedback

### Example Use Cases

- Product catalogs
- Help documentation
- Policy documents
- FAQ databases
- Technical manuals
- Company knowledge bases

---

## Best Practices

### Performance Optimization

1. **Use Flash Models** for lowest latency
   - Flash v2.5: **75ms model time**, 135ms end-to-end TTFB

2. **Enable Streaming** for progressive audio delivery
   - Reduces perceived latency
   - Better user experience

3. **WebSocket Connections** for bidirectional streaming
   - Real-time communication
   - Lower latency than polling

4. **Geographic Proximity**
   - Use nearest region (150-200ms TTFB)
   - ElevenLabs has global infrastructure

5. **Voice Selection**
   - Prefer default/synthetic voices over Instant Voice Clones
   - Faster processing, lower latency

6. **Text Normalization**
   - Have LLM normalize text before TTS
   - Remove unnecessary characters, format numbers

---

### Security

1. **Never expose API keys client-side**
   - ❌ Don't hardcode in React Native code
   - ✅ Use server-side token generation

2. **Generate conversation tokens server-side**
   - Keep API keys on backend
   - Return short-lived tokens (10-min expiry)

3. **Use signed URLs for WebSocket connections**
   - 15-minute expiration
   - Prevents unauthorized access

4. **Enable allowlists**
   - Restrict domains (up to 10)
   - Prevent unauthorized embedding

5. **Use secret variables for sensitive data**
   - Prefix with `secret__`
   - Not sent to LLM providers

6. **Rotate API keys regularly**
   - Monthly or quarterly rotation
   - Immediate rotation if compromised

7. **Implement rate limiting**
   - Prevent abuse
   - Control costs

---

### User Experience

1. **Request permissions early**
   - Ask for microphone access with clear explanation
   - Explain benefits before requesting

2. **Show connection status in UI**
   - Display `status` property
   - Provide visual feedback (connecting, connected, etc.)

3. **Display speaking indicators**
   - Use `isSpeaking` property
   - Show visual cue when agent is talking

4. **Handle disconnections gracefully**
   - Explain disconnection reason
   - Offer reconnect option

5. **Provide feedback mechanism**
   - Use `sendFeedback()` when `canSendFeedback` is true
   - Collect user satisfaction data

6. **Use `sendUserActivity()` to prevent interruptions**
   - Call during typing, scrolling, clicking
   - Creates smooth, non-interruptive experience

7. **Implement retry logic for network failures**
   - Automatic reconnection on network errors
   - Exponential backoff strategy

---

### Tool Configuration

1. **Use descriptive names** - Avoid abbreviations
   - ✅ `searchProducts`, `addToCart`
   - ❌ `srchProd`, `addCart`

2. **Provide detailed descriptions** for tool purposes
   - Explain what the tool does
   - Include expected parameters and return values

3. **Use high-intelligence LLMs** (GPT-4o mini, Claude 3.5 Sonnet)
   - Better tool selection accuracy
   - More reliable parameter extraction

4. **Enable "Wait for response"** when agent needs return values
   - Synchronous tool execution
   - Agent receives and uses return value

5. **Include format guidance** in parameter descriptions
   - Example: "productId (string): Format PROD-12345"
   - Helps LLM extract parameters correctly

---

### LLM Selection Guide

| Task Type | Recommended Model | Reason |
|-----------|------------------|--------|
| Complex reasoning | GPT-4, Claude 3.7 Sonnet, Gemini 2.5 | Highest intelligence |
| Real-time/latency-critical | Gemini Flash, Claude Haiku, GPT-4o-mini | Fast response times |
| Tool usage | GPT-4o mini, Claude 3.5 Sonnet | Best tool-calling performance |
| Cost-sensitive | GPT-4o mini, Claude Haiku | Lower per-token cost |
| Multilingual | Gemini models, GPT-4o | Strong multilingual support |

**Avoid:** Gemini 1.5 Flash for tool-heavy scenarios (less reliable)

---

## Platform-Specific Setup

### iOS Configuration

**Info.plist:**

```xml
<key>NSMicrophoneUsageDescription</key>
<string>Microphone access enables voice conversations with AI agents.</string>
```

**Request Permission:**

```typescript
import { PermissionsAndroid, Platform } from 'react-native';

const requestMicrophonePermission = async () => {
  if (Platform.OS === 'ios') {
    // iOS automatically requests based on Info.plist
    return true;
  }
};
```

---

### Android Configuration

**AndroidManifest.xml:**

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <uses-permission android:name="android.permission.RECORD_AUDIO" />
  <uses-permission android:name="android.permission.INTERNET" />
</manifest>
```

**Request Runtime Permission:**

```typescript
import { PermissionsAndroid, Platform } from 'react-native';

const requestMicrophonePermission = async () => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Microphone Permission',
        message: 'This app needs access to your microphone for voice conversations.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );

    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('Microphone permission granted');
      return true;
    } else {
      console.log('Microphone permission denied');
      return false;
    }
  }
};
```

**Android Emulator Setup:**

1. Open emulator settings
2. Enable "Virtual microphone uses host audio input"
3. Ensure host microphone is working

---

### Expo Configuration

**app.json:**

```json
{
  "expo": {
    "plugins": [
      [
        "@livekit/react-native",
        {
          "microphonePermission": "Microphone access enables voice conversations with AI agents."
        }
      ]
    ]
  }
}
```

**Development Build Required:**

```bash
# Create development build
expo prebuild

# Run on iOS
expo run:ios

# Run on Android
expo run:android
```

**Not Compatible with Expo Go** due to native module dependencies.

---

## LiveKit Integration

### Overview

The ElevenLabs React Native SDK is built on top of **LiveKit's WebRTC infrastructure**. LiveKit handles all real-time bidirectional audio streaming.

### Required LiveKit Packages

```bash
npm install @livekit/react-native @livekit/react-native-webrtc livekit-client
```

**Packages:**
- **@livekit/react-native**: LiveKit React Native SDK
- **@livekit/react-native-webrtc**: WebRTC implementation for native modules
- **livekit-client**: JavaScript client library

### LiveKit Configuration

**Custom Server URL:**

```typescript
await conversation.startSession({
  agentId: 'your_agent_id',
  serverUrl: 'wss://your-custom-livekit-server.com'
});
```

**Default Server:**
- ElevenLabs provides managed LiveKit infrastructure
- No need to run your own server

### WebRTC Features

- **Bidirectional Audio Streaming**: Real-time voice communication
- **Low Latency**: Optimized for conversational AI
- **Adaptive Bitrate**: Adjusts to network conditions
- **Echo Cancellation**: Built-in audio processing
- **Noise Suppression**: Clean audio quality

### Connection Management

LiveKit connections are managed automatically by the SDK:

1. `startSession()` initiates WebRTC connection
2. LiveKit handles audio streaming
3. `endSession()` terminates connection
4. Automatic reconnection on network issues

### Monitoring Connection

```typescript
const conversation = useConversation({
  onStatusChange: ({ status }) => {
    // "connecting" → establishing WebRTC connection
    // "connected" → LiveKit session active
    // "disconnecting" → closing WebRTC connection
    // "disconnected" → LiveKit session ended
  }
});
```

---

## Error Handling

### Error Handling Pattern

```typescript
const conversation = useConversation({
  onError: (message, context) => {
    console.error('Error:', message);
    console.error('Context:', context);

    // Handle specific errors
    if (message.includes('permission')) {
      showPermissionErrorDialog();
    } else if (message.includes('network')) {
      attemptReconnect();
    } else if (message.includes('token')) {
      refreshToken();
    } else {
      showGenericErrorDialog();
    }
  },

  onDisconnect: ({ reason }) => {
    if (reason === 'error') {
      // Handle error disconnections
      console.log('Disconnected due to error');
      showReconnectOption();
    } else if (reason === 'user') {
      // User-initiated disconnect
      console.log('User ended conversation');
    } else if (reason === 'agent') {
      // Agent ended conversation
      console.log('Agent ended conversation');
    }
  }
});
```

### Common Issues & Solutions

#### 1. Peer Dependency Warnings

**Problem:**
```
npm WARN ERESOLVE overriding peer dependency
```

**Solution:**
Create `.npmrc` file:
```
legacy-peer-deps=true
```

---

#### 2. Events Not Firing

**Problem:**
Callbacks like `onAudio`, `onVadScore`, etc. not being called.

**Solution:**
Enable events in ElevenLabs dashboard:
1. Navigate to agent settings
2. Go to "Advanced" tab
3. Enable specific events you need

---

#### 3. Microphone Permission Denied

**Problem:**
App crashes or can't access microphone.

**Solution:**
- Request permissions before starting session
- Provide clear UI explanation
- Check Info.plist (iOS) or AndroidManifest.xml (Android)

```typescript
const requestPermissions = async () => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true; // iOS handles automatically
};

// Request before starting
const hasPermission = await requestPermissions();
if (hasPermission) {
  await conversation.startSession({ agentId });
} else {
  showPermissionErrorDialog();
}
```

---

#### 4. WebSocket Connection Errors

**Problem:**
Cannot establish connection to agent.

**Solution:**
- Verify network connectivity
- Check firewall/proxy settings
- Ensure token is valid (10-minute expiry)
- Try refreshing conversation token

```typescript
const startWithRetry = async (maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Get fresh token
      const { token } = await fetchConversationToken();
      await conversation.startSession({ conversationToken: token });
      return; // Success
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1))); // Exponential backoff
    }
  }
};
```

---

#### 5. LiveKit Dependencies Not Found

**Problem:**
```
Module not found: Can't resolve '@livekit/react-native'
```

**Solution:**
Verify all three packages are installed:
```bash
npm install @livekit/react-native @livekit/react-native-webrtc livekit-client
```

Then rebuild development build:
```bash
expo prebuild
expo run:ios  # or expo run:android
```

---

#### 6. Audio Not Playing

**Problem:**
Connection successful but no audio heard.

**Solution:**
- Check device volume
- Verify agent TTS configuration
- Check `isSpeaking` property
- Monitor `onAudio` callback for audio chunks

```typescript
const conversation = useConversation({
  onAudio: (audioChunk) => {
    console.log('Audio chunk received:', audioChunk.length);
    // If this logs, audio is being received
  },

  onError: (message, context) => {
    if (message.includes('audio')) {
      console.log('Audio-related error:', message);
    }
  }
});
```

---

## Performance Optimization

### Latency Optimization

**End-to-End Latency Breakdown:**

| Component | Time | Optimization |
|-----------|------|--------------|
| **Network (User → Server)** | 150-200ms | Use nearest region |
| **ASR (Speech-to-Text)** | 150ms | Use Scribe v2 Realtime |
| **LLM Processing** | 200-500ms | Use fast models (GPT-4o-mini, Claude Haiku) |
| **TTS Model** | 75-200ms | Use Flash v2.5 (75ms) |
| **Network (Server → User)** | 150-200ms | Use nearest region |
| **Total** | ~725-1250ms | Target: <1000ms for good UX |

**Optimization Strategies:**

1. **Use Flash TTS Model**
   ```typescript
   tts: {
     model: "flash",  // 75ms model time
     optimize_streaming_latency: 4  // Maximum optimization
   }
   ```

2. **Use Fast LLMs**
   - GPT-4o-mini: ~200-300ms
   - Claude Haiku: ~200-400ms
   - Gemini Flash: ~150-250ms

3. **Enable Streaming**
   - Progressive audio delivery
   - Reduces perceived latency

4. **Optimize System Prompt**
   - Shorter prompts = faster processing
   - Maximum: 2MB

5. **Use Voice Activity Detection (VAD)**
   - Detect speech end faster
   - Reduce turn-taking delay

---

### Network Optimization

1. **Geographic Proximity**
   - Use nearest ElevenLabs region
   - Reduces network latency

2. **WebSocket Connection**
   - Persistent bidirectional connection
   - Lower overhead than HTTP polling

3. **Audio Buffering**
   - Implement jitter buffer for poor network
   - Smooth playback

4. **Adaptive Bitrate**
   - LiveKit automatically adjusts
   - Maintains quality on varying network

---

### Cost Optimization

**Voice Call Pricing:**
- Based on call duration
- **95% discount** for silence >10 seconds
- LLM costs passed through separately

**Strategies:**

1. **Silence Detection**
   - Automatic 95% discount for silence >10s
   - No action needed

2. **Choose Cost-Effective LLMs**
   - GPT-4o-mini: Low cost, good performance
   - Claude Haiku: Low cost, fast
   - Avoid GPT-4 for simple tasks

3. **Optimize RAG Usage**
   - Fewer chunks = lower LLM cost
   - Start with 3-5 chunks

4. **Use Text-Only Mode** when appropriate
   ```typescript
   conversation_config: {
     text_only_mode: true  // Disable voice, reduce costs
   }
   ```

5. **Set Max Duration**
   ```typescript
   conversation_config: {
     max_duration_minutes: 10  // Prevent runaway costs
   }
   ```

---

## Additional Resources

### Official Documentation
- [React Native SDK](https://elevenlabs.io/docs/agents-platform/libraries/react-native)
- [Agents Platform Overview](https://elevenlabs.io/docs/agents-platform/overview)
- [API Reference](https://elevenlabs.io/docs/api-reference/introduction)

### Code Examples
- [GitHub React Native Package](https://github.com/elevenlabs/packages/tree/main/packages/react-native)
- [Expo Example Project](https://github.com/elevenlabs/packages/tree/main/examples/react-native-expo)

### LiveKit Integration
- [ElevenLabs Integration Guide](https://docs.livekit.io/agents/integrations/elevenlabs/)
- [LiveKit Python Plugin](https://pypi.org/project/livekit-plugins-elevenlabs/)

### Specific Topics
- [Client Tools](https://elevenlabs.io/docs/agents-platform/customization/tools/client-tools)
- [Server Tools](https://elevenlabs.io/docs/agents-platform/customization/tools/server-tools)
- [Dynamic Variables](https://elevenlabs.io/docs/agents-platform/customization/personalization/dynamic-variables)
- [Authentication](https://elevenlabs.io/docs/agents-platform/customization/authentication)
- [RAG Configuration](https://elevenlabs.io/docs/agents-platform/customization/knowledge-base/rag)
- [Latency Optimization](https://elevenlabs.io/docs/best-practices/latency-optimization)

---

## Summary

The ElevenLabs Voice Agent SDK for React Native provides a comprehensive, production-ready solution for building real-time voice AI applications.

**Key Features:**
- ✅ **LiveKit Integration** - WebRTC infrastructure for real-time audio
- ✅ **Complete React Native Support** - `@elevenlabs/react-native` package
- ✅ **15 Event Callbacks** - Comprehensive state management
- ✅ **Client Tools** - Execute JavaScript functions from agent
- ✅ **Dynamic Variables** - Personalize conversations
- ✅ **RAG Support** - Knowledge base integration
- ✅ **31 Languages** - Multilingual support
- ✅ **Multiple LLM Options** - OpenAI, Anthropic, Google
- ✅ **Ultra-Low Latency** - Flash model: 75ms, 135ms TTFB
- ✅ **Secure Authentication** - Token-based, signed URLs
- ✅ **Cross-Platform** - iOS & Android via Expo

**Perfect For:**
- Voice-enabled shopping assistants
- Customer support chatbots
- Educational voice tutors
- Healthcare voice agents
- Smart home voice control
- Any real-time conversational AI application

---

**Document Version:** 1.0
**Last Updated:** 2025-11-22
**Maintained By:** BGOS Development Team
