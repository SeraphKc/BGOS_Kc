# BGOS N8N Backend - Complete Reference

> **Last Updated**: November 30, 2025
> **Status**: Production
> **Workflow Name**: ASSISTANT_LOADER

---

## Table of Contents

1. [Overview](#1-overview)
2. [Database Schema](#2-database-schema)
3. [All Webhook Endpoints](#3-all-webhook-endpoints)
4. [Clerk Authentication](#4-clerk-authentication)
5. [Scheduled Tasks System](#5-scheduled-tasks-system)
6. [Not Implemented / Future Features](#6-not-implemented--future-features)
7. [Frontend Integration](#7-frontend-integration)

---

## 1. Overview

### Tech Stack

| Component | Technology |
|-----------|------------|
| Workflow Engine | n8n (self-hosted) |
| Database | PostgreSQL 14+ |
| AI | OpenAI GPT-4.1-mini |
| Authentication | Clerk (email/password, Google OAuth in progress) |
| Frontend | Electron (desktop), React Native (mobile) |
| State Management | Redux Toolkit |

### Base URL

```
https://n8n-test.brandgrowthos.ai/webhook/b6f845bc-2d9c-43b2-8412-c81871c8bf89
```

### Credentials

| Service | Credential ID | Name |
|---------|--------------|------|
| PostgreSQL | `deemRP1x5Z5wxU6M` | Postgres account |
| OpenAI | `Xp9BPHvoVunMr5gJ` | n8n-test |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend Applications                        │
│  ┌──────────────┐              ┌─────────────────┐              │
│  │   Desktop    │              │     Mobile       │              │
│  │  (Electron)  │              │ (React Native)   │              │
│  └──────┬───────┘              └────────┬─────────┘              │
└─────────│──────────────────────────────│────────────────────────┘
          │ IPC                          │ HTTP
          ▼                              ▼
    ┌─────────────────────────────────────────┐
    │           n8n Workflows                  │
    │  ┌─────────────────────────────────────┐│
    │  │  ASSISTANT_LOADER (17 webhooks)     ││
    │  │  • CRUD for assistants/chats        ││
    │  │  • Clerk authentication             ││
    │  │  • Scheduled tasks                  ││
    │  └─────────────────────────────────────┘│
    │  ┌─────────────────────────────────────┐│
    │  │  Ava Workflow (AI Assistant)        ││
    │  │  • Message processing               ││
    │  │  • OpenAI integration               ││
    │  └─────────────────────────────────────┘│
    └────────────┬────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
┌──────────┐           ┌──────────┐
│PostgreSQL│           │ OpenAI   │
│ Database │           │   API    │
└──────────┘           └──────────┘
```

---

## 2. Database Schema

### 2.1 AA_USER

**Purpose**: User accounts and profile information

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | bigint | NO | auto | Primary key |
| `email` | varchar | YES | - | User email address |
| `name` | varchar | YES | - | Display name |
| `avatar_url` | varchar | YES | - | Avatar image URL or base64 |
| `role` | varchar | YES | NULL | User role (not implemented) |
| `theme` | varchar | YES | 'dark' | UI theme preference |
| `language` | varchar | YES | 'en' | Language preference |
| `notifications` | boolean | YES | - | Notifications enabled |

**Additional Columns** (added via migration):
- `clerk_user_id` - Clerk user ID for authentication ✅

**Not Yet Implemented**:
- `password_hash` - For local auth (not needed with Clerk)
- `created_at` - Account creation timestamp
- `last_login` - Last login timestamp
- `is_active` - Account status

---

### 2.2 AA_ASSISTANT

**Purpose**: AI assistant configurations

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | bigint | NO | auto | Primary key |
| `user_id` | bigint | NO | - | FK to AA_USER |
| `name` | varchar | YES | - | Assistant display name |
| `avatar_url` | varchar | YES | - | Avatar image |
| `webhook` | varchar | YES | - | n8n webhook URL for this assistant |
| `subtitle` | varchar | YES | - | Description/tagline |
| `code` | varchar | YES | - | Unique code ('ava', 'erica', etc.) |
| `s2s_token` | varchar | YES | - | Server-to-server auth token |
| `display_order` | bigint | YES | - | Sort order in sidebar |

**Frontend Mapping**:
```typescript
// DB (snake_case) → Frontend (camelCase)
{
  id: assistant.id,
  userId: assistant.user_id,
  name: assistant.name,
  subtitle: assistant.subtitle,
  avatarUrl: assistant.avatar_url,
  webhookUrl: assistant.webhook,
  s2sToken: assistant.s2s_token,
  code: assistant.code
}
```

---

### 2.3 AA_CHAT

**Purpose**: Chat conversations

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | bigint | NO | auto | Primary key |
| `assistant_id` | bigint | NO | - | FK to AA_ASSISTANT |
| `title` | varchar | YES | - | Chat title (AI-generated) |
| `user_id` | bigint | NO | - | FK to AA_USER |
| `unread` | bigint | NO | 0 | Unread message count |

**Missing Columns**:
- `created_at` - Creation timestamp
- `is_starred` - User favorite flag
- `star_order` - Sort order for favorites

---

### 2.4 AA_CHAT_HISTORY

**Purpose**: Individual messages

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | bigint | NO | auto | Primary key |
| `chat_id` | bigint | NO | - | FK to AA_CHAT |
| `sender` | varchar | YES | - | 'user' or 'assistant' |
| `sent_date` | timestamptz | YES | - | Message timestamp |
| `text` | text | YES | - | Message content |
| `audio_file_name` | varchar | YES | - | Audio file name |
| `user_id` | bigint | NO | - | FK to AA_USER |
| `is_audio` | boolean | YES | - | Is audio message |
| `has_attachment` | boolean | YES | - | Has file attachments |
| `audio_data` | text | YES | - | Base64 audio data |
| `audio_mime_type` | varchar | YES | - | Audio MIME type |
| `artifact_code` | text | YES | - | Code artifact content |
| `is_code` | boolean | YES | - | Has code artifact |
| `is_article` | boolean | YES | - | Has article content |
| `article_text` | text | YES | - | Article content |
| `files` | jsonb | YES | - | Array of file objects |
| `is_multi_response` | boolean | YES | - | Multiple response parts |
| `is_mixed_attachments` | boolean | YES | - | Mixed file types |
| `local_id` | bigint | YES | - | Client-side temp ID |
| `reply_markup` | jsonb | YES | - | Inline keyboard markup ✅ |

---

### 2.5 AA_SCHEDULED_TASKS

**Purpose**: Periodic tasks for proactive assistant messages

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | bigint | NO | auto | Primary key |
| `user_id` | bigint | YES | - | FK to AA_USER |
| `chat_id` | bigint | YES | - | FK to AA_CHAT |
| `subject` | varchar | YES | - | Task prompt for assistant |
| `period` | bigint | NO | 1 | Hours between executions |
| `next_call` | timestamp | YES | - | Next execution time |
| `assistant_code` | varchar | YES | - | Which assistant handles task |
| `modified_date` | timestamp | YES | - | Last modification time |

---

### Entity Relationships

```
AA_USER (1) ──────< (Many) AA_ASSISTANT
                          │
                          │ (1)
                          │
                          ├──────< (Many) AA_CHAT
                          │              │
                          │              │ (1)
                          │              │
                          │              ├──────< (Many) AA_CHAT_HISTORY
                          │              │
                          │              └──────< (Many) AA_SCHEDULED_TASKS
```

---

## 3. All Webhook Endpoints

### Quick Reference (17 endpoints)

| # | Method | Path | Purpose |
|---|--------|------|---------|
| 1 | GET | `/assistants-with-chats/:userId` | Load assistants + chats on login |
| 2 | POST | `/assistants/:userId` | Create new assistant |
| 3 | PUT | `/assistants/:userId/:assistantId` | Update assistant |
| 4 | DELETE | `/assistants/:userId/:assistantId` | Delete assistant (cascade) |
| 5 | GET | `/chat-history/:userId/:chatId` | Load last 20 messages |
| 6 | POST | `/:userId/chats` | Create chat with AI title |
| 7 | POST | `/:userId/chatstest` | Create chat (simple, for testing) |
| 8 | PATCH | `/chats/:userId/:chatId` | Rename chat |
| 9 | DELETE | `/chats/:userId/:chatId` | Delete chat (cascade) |
| 10 | GET | `/unread-messages/:userId` | Get unread counts |
| 11 | PATCH | `/unread-messages/:userId` | Increment unread |
| 12 | POST | `/b6f845bc.../increment-unread` | Alt increment unread (internal) |
| 13 | POST | `/assign-scheduled/:userId/:chatId` | Create scheduled task |
| 14 | POST | `/chat-history/:userId` | Bulk insert messages |
| 15 | POST | `/:userId/rename-new-chat` | AI rename existing chat |
| 16 | POST | `/b6f845bc.../auth/sync-user` | Clerk sync user |
| 17 | POST | `/clerk-webhook` | Clerk webhook events |

---

### 3.1 GET /assistants-with-chats/:userId

**Purpose**: Load all assistants and chats on login

**When Called**: After successful user authentication

**Request**:
```http
GET /assistants-with-chats/1 HTTP/1.1
```

**SQL Queries**:
```sql
-- Select assistants (sorted by display_order, then id)
SELECT * FROM "AA_ASSISTANT"
WHERE user_id = '1'
ORDER BY display_order, id;

-- Select chats (sorted by last_message_date DESC)
SELECT c.id, c.assistant_id, c.user_id, c.title, c.unread,
  (SELECT MAX(sent_date) FROM "AA_CHAT_HISTORY" h WHERE h.chat_id = c.id) as last_message_date
FROM "AA_CHAT" c
WHERE c.user_id = '1'
ORDER BY last_message_date DESC NULLS LAST, c.id DESC;
```

**Response**:
```json
{
  "assistants": [
    {
      "id": 4,
      "user_id": 1,
      "name": "Ava",
      "subtitle": "Personal Assistant",
      "avatar_url": "default1",
      "webhook": "https://n8n.../ava",
      "s2s_token": "agent_xxx",
      "code": "ava",
      "display_order": 1
    }
  ],
  "chats": [
    {
      "id": 123,
      "assistant_id": 4,
      "user_id": 1,
      "title": "Project Discussion",
      "unread": 0,
      "last_message_date": "2025-11-30T10:00:00Z"
    }
  ]
}
```

**Frontend Service**: `useFetchAssistantsWithChatsQuery` in DatabaseSyncService.ts

---

### 3.2 POST /assistants/:userId

**Purpose**: Create a new assistant

**Request**:
```json
{
  "name": "Sales Assistant",
  "subtitle": "Helps with sales",
  "avatarUrl": "default2",
  "webhookUrl": "https://n8n.../sales",
  "s2sToken": "agent_abc",
  "code": "sales"
}
```

**SQL Query**:
```sql
INSERT INTO "AA_ASSISTANT" (user_id, name, avatar_url, webhook, subtitle, code, s2s_token, display_order)
VALUES (
  '1',
  'Sales Assistant',
  'default2',
  'https://n8n.../sales',
  'Helps with sales',
  'sales',
  'agent_abc',
  COALESCE((SELECT MAX(display_order) + 1 FROM "AA_ASSISTANT" WHERE user_id = '1'), 0)
)
RETURNING *;
```

**Response**: Returns created assistant object

**Frontend Service**: `createAssistant` in AssistantCRUDService.ts

---

### 3.3 PUT /assistants/:userId/:assistantId

**Purpose**: Update assistant details

**Request**:
```json
{
  "name": "Updated Name",
  "subtitle": "New subtitle",
  "avatarUrl": "default1",
  "webhookUrl": "https://n8n.../webhook",
  "s2sToken": "new_token",
  "code": "ava"
}
```

**SQL Query**:
```sql
UPDATE "AA_ASSISTANT"
SET
  NAME = 'Updated Name',
  AVATAR_URL = 'default1',
  WEBHOOK = 'https://n8n.../webhook',
  SUBTITLE = 'New subtitle',
  S2S_TOKEN = 'new_token',
  CODE = 'ava'
WHERE USER_ID = '1' AND ID = '4';
```

**Frontend Service**: `updateAssistant` in AssistantCRUDService.ts

---

### 3.4 DELETE /assistants/:userId/:assistantId

**Purpose**: Delete assistant and all related data

**SQL Query** (cascade delete):
```sql
-- Step 1: Delete all chat history for this assistant's chats
DELETE FROM "AA_CHAT_HISTORY"
WHERE USER_ID = '1' AND CHAT_ID IN (
  SELECT ID FROM "AA_CHAT"
  WHERE USER_ID = '1' AND ASSISTANT_ID = '4'
);

-- Step 2: Delete all chats for this assistant
DELETE FROM "AA_CHAT"
WHERE USER_ID = '1' AND ASSISTANT_ID = '4';

-- Step 3: Delete the assistant
DELETE FROM "AA_ASSISTANT"
WHERE USER_ID = '1' AND ID = '4';
```

**Frontend Service**: `deleteAssistant` in AssistantCRUDService.ts

---

### 3.5 GET /chat-history/:userId/:chatId

**Purpose**: Load last 20 messages for a chat

**When Called**: When user clicks on a chat in sidebar

**SQL Query**:
```sql
SELECT *
FROM (
  SELECT *
  FROM "AA_CHAT_HISTORY"
  WHERE USER_ID = '1' AND CHAT_ID = '123'
  ORDER BY SENT_DATE DESC
  LIMIT 20
) sub
ORDER BY SENT_DATE ASC;
```

**Side Effect**: Resets unread counter
```sql
UPDATE "AA_CHAT"
SET UNREAD = 0
WHERE USER_ID = '1' AND ID = '123';
```

**Response**:
```json
{
  "chatHistory": [
    {
      "id": 456,
      "chat_id": 123,
      "user_id": 1,
      "sender": "user",
      "sent_date": "2025-11-30T10:00:00Z",
      "text": "Hello!",
      "is_audio": false,
      "has_attachment": false
    }
  ]
}
```

**Frontend Service**: `useFetchChatHistoryQuery` in DatabaseSyncService.ts

---

### 3.6 POST /:userId/chats

**Purpose**: Create new chat with AI-generated title

**When Called**: User sends first message to blank chat

**Request**:
```json
{
  "chatFirstMessage": "Help me plan a marketing campaign",
  "assistantId": "4"
}
```

**Workflow**:
1. Call OpenAI GPT-4.1-mini with system prompt:
   ```
   Analyze the incoming text and come up with a topic title based on it.
   Come up with a short title up to 5 words long.
   Response only with this name and no more
   ```
2. Insert chat with generated title

**SQL Query**:
```sql
INSERT INTO "AA_CHAT"(ASSISTANT_ID, USER_ID, TITLE)
VALUES (
  COALESCE(4, (SELECT MAX(a.ID) FROM "AA_ASSISTANT" AS a WHERE a.user_id = 1)),
  1,
  'Marketing Campaign Planning'
)
RETURNING *;
```

**Note**: If assistantId is empty, uses the most recent assistant for the user.

**Frontend Service**: `useAddChatMutation` in DatabaseSyncService.ts

---

### 3.7 POST /:userId/chatstest

**Purpose**: Create chat without AI title (test endpoint)

**Request**:
```json
{
  "assistantId": "4"
}
```

**Response**: Chat with default title "Chat topic"

---

### 3.8 PATCH /chats/:userId/:chatId

**Purpose**: Rename chat

**Request**:
```json
{
  "title": "New Chat Title"
}
```

**SQL Query**:
```sql
UPDATE "AA_CHAT"
SET TITLE = 'New Chat Title'
WHERE USER_ID = '1' AND ID = '123';
```

**Frontend Service**: `renameChat` in ChatCRUDService.ts

---

### 3.9 DELETE /chats/:userId/:chatId

**Purpose**: Delete chat and all messages

**SQL Query**:
```sql
-- Delete all messages first
DELETE FROM "AA_CHAT_HISTORY"
WHERE USER_ID = '1' AND CHAT_ID = '123';

-- Delete the chat
DELETE FROM "AA_CHAT"
WHERE USER_ID = '1' AND ID = '123';
```

**Frontend Service**: `deleteChat` in ChatCRUDService.ts

---

### 3.10 GET /unread-messages/:userId

**Purpose**: Get chats with unread messages

**When Called**: Periodically for sidebar indicators

**SQL Query**:
```sql
SELECT c.ID, c.UNREAD::INT
FROM "AA_CHAT" AS c
WHERE c.USER_ID = '1' AND c.UNREAD > 0;
```

**Response**:
```json
{
  "unreadChats": [
    { "id": 123, "unread": 3 },
    { "id": 456, "unread": 1 }
  ]
}
```

**Frontend Service**: `fetchUnreadMessages` in FetchUnreadMessagesService.ts

---

### 3.11 PATCH /unread-messages/:userId

**Purpose**: Increment unread counter

**Request**:
```json
{
  "chatId": 123
}
```

**SQL Query**:
```sql
UPDATE "AA_CHAT"
SET UNREAD = UNREAD + 1
WHERE USER_ID = '1' AND ID = '123';
```

---

### 3.12 POST /b6f845bc.../increment-unread

**Purpose**: Alternative increment unread (internal use)

**Request**:
```json
{
  "userId": "1",
  "chatId": "123"
}
```

**Note**: Used internally by N8N workflows after assistant responses.

---

### 3.13 POST /assign-scheduled/:userId/:chatId

**Purpose**: Create a scheduled task

**When Called**: User selects "Add Schedule" for a chat

**Request**:
```json
{
  "subject": "Daily weather update for London",
  "period": 24,
  "code": "ava"
}
```

**SQL Query**:
```sql
INSERT INTO "AA_SCHEDULED_TASKS"(USER_ID, CHAT_ID, SUBJECT, PERIOD, NEXT_CALL, ASSISTANT_CODE)
VALUES (
  '1',
  '123',
  'Daily weather update for London',
  '24',
  (now() + ('24'::INT8 || ' hour')::interval),
  'ava'
)
RETURNING *;
```

**Frontend Service**: `assignScheduledChat` in ChatCRUDService.ts

---

### 3.14 POST /chat-history/:userId

**Purpose**: Bulk insert messages (after speech-to-speech)

**When Called**: End of speech-to-speech conversation

**Request**:
```json
{
  "messages": [
    {
      "chatId": 123,
      "sender": "user",
      "text": "What's the weather like?"
    },
    {
      "chatId": 123,
      "sender": "assistant",
      "text": "It's sunny with a high of 75°F."
    }
  ]
}
```

**Workflow**: Splits array and inserts each message individually

**Frontend Service**: `saveChatHistory` in ChatHistoryCRUDService.ts

---

### 3.15 POST /:userId/rename-new-chat

**Purpose**: AI-rename an existing chat

**Request**:
```json
{
  "chatId": 123,
  "assistantId": 4,
  "chatFirstMessage": "Can you help me plan a marketing campaign?"
}
```

**Workflow**:
1. Call OpenAI to generate title
2. Update chat with new title

**SQL Query**:
```sql
UPDATE "AA_CHAT"
SET TITLE = 'Marketing Campaign Planning'
WHERE ID = '123' AND assistant_id = '4';
```

---

### 3.16 POST /b6f845bc.../auth/sync-user

**Purpose**: Sync user from Clerk authentication

**When Called**: After successful Clerk login (mobile/desktop)

**Request**:
```json
{
  "clerkUserId": "user_2abc123",
  "email": "user@example.com",
  "name": "John Doe",
  "avatarUrl": "https://..."
}
```

**Workflow**:
1. Find user by clerk_user_id OR email
2. If found: Update user (link clerk_user_id if missing)
3. If not found: Create new user

**SQL Queries**:
```sql
-- Find existing user
SELECT id, email, name, avatar_url, clerk_user_id
FROM "AA_USER"
WHERE clerk_user_id = 'user_2abc123' OR email = 'user@example.com'
LIMIT 1;

-- Update existing user
UPDATE "AA_USER"
SET clerk_user_id = 'user_2abc123',
    name = COALESCE(NULLIF('John Doe', ''), name),
    avatar_url = COALESCE(NULLIF('https://...', ''), avatar_url),
    last_login = NOW()
WHERE id = 1
RETURNING id, email, name;

-- OR Create new user
INSERT INTO "AA_USER" (email, name, avatar, clerk_user_id, is_active, created_at)
VALUES ('user@example.com', 'John Doe', 'https://...', 'user_2abc123', true, NOW())
RETURNING id, email, name;
```

**Response**:
```json
{
  "success": true,
  "userId": "1",
  "email": "user@example.com",
  "name": "John Doe"
}
```

---

### 3.17 POST /clerk-webhook

**Purpose**: Handle Clerk webhook events

**When Called**: Clerk sends webhook on user.created event

**Headers Required**:
- `svix-id` - Webhook ID
- `svix-timestamp` - Unix timestamp
- `svix-signature` - HMAC signature

**Request Body**:
```json
{
  "type": "user.created",
  "data": {
    "id": "user_2abc123",
    "email_addresses": [
      { "email_address": "user@example.com" }
    ],
    "first_name": "John"
  }
}
```

**Workflow**:
1. Verify Svix headers exist (basic validation)
2. Check timestamp not too old (1 hour tolerance)
3. If event is `user.created`:
   - Check if user exists by email
   - If exists: Link Clerk ID to existing user
   - If not: Create new user

**Note**: Full HMAC-SHA256 signature verification is not possible in n8n sandbox. Security relies on secret webhook path.

---

## 4. Clerk Authentication

### Authentication Flow

```
┌─────────────────┐
│  User opens app │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Clerk Sign-In   │  (email/password or Google OAuth)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Clerk returns   │
│ session + user  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Frontend calls sync-user        │
│ POST /auth/sync-user            │
│ { clerkUserId, email, name }    │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ N8N workflow:                   │
│ 1. Find user by clerkId/email   │
│ 2. Create or update user        │
│ 3. Return internal userId       │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Frontend uses internal userId   │
│ for all subsequent API calls    │
└─────────────────────────────────┘
```

### Database Support

The `clerk_user_id` column has been added to AA_USER table ✅

### Known Issues

1. **Google OAuth not working** (Issue #17)
   - Google Sign-In returns `idToken: null`
   - Email/password works correctly
   - Requires investigation of Google Cloud Console OAuth config

---

## 5. Scheduled Tasks System

### How It Works

```
┌──────────────────────────────────────────────────────────────┐
│                    Schedule Trigger                           │
│                    (runs every hour)                          │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  SELECT * FROM "AA_SCHEDULED_TASKS" WHERE next_call < now()  │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                    Loop Over Items                            │
│  For each pending task:                                       │
└────────────────────────┬─────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
     ┌────────┐    ┌─────────┐    ┌─────────┐
     │  ava   │    │  erica  │    │  sales  │
     │workflow│    │workflow │    │workflow │
     └────┬───┘    └────┬────┘    └────┬────┘
          │              │              │
          └──────────────┼──────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  1. Update next_call = now() + (period hours)                │
│  2. Execute assistant workflow with subject                   │
│  3. Insert response to AA_CHAT_HISTORY                        │
│  4. Increment unread counter on AA_CHAT                       │
└──────────────────────────────────────────────────────────────┘
```

### SQL Queries

**Select pending tasks**:
```sql
SELECT st.*
FROM "AA_SCHEDULED_TASKS" st
WHERE st.next_call < now()::timestamp;
```

**Update next call time**:
```sql
UPDATE "AA_SCHEDULED_TASKS"
SET next_call = now() + ("period"::INT8 || ' hour')::interval,
    modified_date = now()
WHERE id = '10';
```

**Insert assistant response**:
```sql
INSERT INTO "AA_CHAT_HISTORY"(chat_id, sender, sent_date, text, user_id, local_id)
VALUES (123, 'assistant', NOW(), 'Here is your weather update...', 1, 1);
```

**Increment unread**:
```sql
UPDATE "AA_CHAT"
SET UNREAD = UNREAD + 1
WHERE USER_ID = '1' AND ID = '123';
```

### Currently Supported Assistants

| Code | Workflow | Status |
|------|----------|--------|
| `ava` | Ava workflow (48aZciARg5wvEqmi) | Active |
| `erica` | - | Not implemented |
| `sales` | - | Not implemented |

**Note**: The Switch node only routes to 'ava' currently. Other codes fall through without processing.

---

## 6. Not Implemented / Future Features

### 6.1 Missing Database Columns

| Table | Column | Purpose |
|-------|--------|---------|
| AA_USER | `created_at` | Account creation timestamp |
| AA_USER | `last_login` | Last login tracking |
| AA_USER | `is_active` | Account status |
| AA_ASSISTANT | - | All needed columns present |
| AA_CHAT | `created_at` | Chat creation timestamp |
| AA_CHAT | `is_starred` | Favorites feature |
| AA_CHAT | `star_order` | Favorites ordering |

**Recently Added** (migrations completed):
- AA_USER.`clerk_user_id` ✅
- AA_CHAT_HISTORY.`reply_markup` ✅

### 6.2 Missing Endpoints

| Endpoint | Purpose |
|----------|---------|
| POST /assistants/:userId/:assistantId/star | Star/unstar assistant |
| POST /chats/:userId/:chatId/star | Star/unstar chat |
| PATCH /assistants/:userId/star-order | Reorder starred assistants |
| PATCH /chats/:userId/star-order | Reorder starred chats |
| DELETE /scheduled-tasks/:taskId | Delete scheduled task |
| GET /scheduled-tasks/:userId | List scheduled tasks |
| POST /chats/:userId/bulk-delete | Bulk delete chats |

### 6.3 Security Gaps

| Issue | Severity | Status |
|-------|----------|--------|
| No authentication on webhooks | HIGH | Open - relies on secret UUID path |
| No input validation | MEDIUM | Open |
| No rate limiting | MEDIUM | Open |
| SQL injection via string interpolation | LOW | Mitigated in most places |
| CORS disabled | LOW | By design for Electron |

### 6.4 Missing Features

1. **Pagination**: Chat history loads all 20 at once, no infinite scroll
2. **Message editing**: Cannot edit sent messages
3. **Message deletion**: Cannot delete individual messages
4. **File upload to cloud**: Files stored as base64 in database
5. **Real-time updates**: Uses polling instead of WebSocket/SSE
6. **Multiple assistant routing**: Only 'ava' assistant works in scheduled tasks

### 6.5 Migrations

**Completed**:
```sql
-- Already applied ✅
ALTER TABLE "AA_USER" ADD COLUMN clerk_user_id VARCHAR(255);
ALTER TABLE "AA_CHAT_HISTORY" ADD COLUMN reply_markup JSONB;
```

**Future Migrations** (for missing features):
```sql
-- AA_USER (for full user tracking)
ALTER TABLE "AA_USER"
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- AA_CHAT (for favorites feature)
ALTER TABLE "AA_CHAT"
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS star_order INTEGER;

CREATE INDEX IF NOT EXISTS idx_aa_chat_starred ON "AA_CHAT"(user_id, is_starred, star_order);
```

---

## 7. Frontend Integration

### 7.1 IPC Bridge Pattern (Electron)

```typescript
// preload.js
window.electronAPI = {
  sendWebhookRequest: async (url, formDataObj) => {
    return await ipcRenderer.invoke('send-webhook-request', url, formDataObj);
  }
};

// main.js
ipcMain.handle('send-webhook-request', async (event, url, formDataObj) => {
  const FormData = (await import('form-data')).default;
  const fetch = (await import('node-fetch')).default;

  const form = new FormData();
  // Convert formDataObj to FormData...

  const response = await fetch(url, {
    method: 'POST',
    body: form,
    headers: form.getHeaders()
  });

  return response.json();
});
```

### 7.2 Service Layer

| Service | Purpose | Methods |
|---------|---------|---------|
| DatabaseSyncService.ts | RTK Query for main CRUD | useFetchAssistantsWithChatsQuery, useFetchChatHistoryQuery, useAddChatMutation |
| AssistantCRUDService.ts | Assistant operations | createAssistant, updateAssistant, deleteAssistant |
| ChatCRUDService.ts | Chat operations | renameChat, deleteChat, assignScheduledChat |
| ChatHistoryCRUDService.ts | Message operations | saveChatHistory |
| FetchUnreadMessagesService.ts | Unread polling | fetchUnreadMessages |

### 7.3 Data Format Mapping

| Database | Frontend | Example |
|----------|----------|---------|
| snake_case | camelCase | user_id → userId |
| TIMESTAMP | Date/string | 2025-11-30T10:00:00Z |
| BOOLEAN | boolean | true/false |
| JSONB | object | { inline_keyboard: [...] } |

### 7.4 Redux State Sync

```typescript
// After fetch assistants with chats
dispatch(setAssistants(mapAssistants(response.assistants)));
dispatch(setChats(mapChats(response.chats)));

// After fetch chat history
dispatch(setChatHistory({
  chatId,
  messages: mapChatHistory(response.chatHistory)
}));

// After receiving unread counts
response.unreadChats.forEach(({ id, unread }) => {
  dispatch(updateChatUnread({ chatId: id, unread }));
});
```

---

## Quick Reference

### Base URL
```
https://n8n-test.brandgrowthos.ai/webhook/b6f845bc-2d9c-43b2-8412-c81871c8bf89
```

### Common Patterns

**All endpoints use**:
- URL params: `:userId`, `:chatId`, `:assistantId`
- Body: JSON with camelCase keys
- Response: JSON with snake_case keys (from database)

**Error responses**:
```json
{
  "error": {
    "message": "Description",
    "code": "ERROR_CODE"
  }
}
```

**Note**: Most errors return generic 500 with minimal details.

---

*This document was auto-generated based on the N8N workflow export and verified database schema. For updates, check the n8n Back-End.json file.*
