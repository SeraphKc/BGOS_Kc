# AVA Assistant - API Endpoints Reference

> **Last Updated**: November 4, 2025
> **Base URL**: `https://n8n-test.brandgrowthos.ai/webhook/b6f845bc-2d9c-43b2-8412-c81871c8bf89`
> **Protocol**: HTTPS
> **Format**: JSON (snake_case in DB, camelCase in frontend)

---

## Overview

All backend operations are exposed as webhook endpoints through n8n workflows. The frontend communicates with these endpoints via Electron IPC, not direct HTTP requests.

**Important**: This is a **single technical workflow** serving all users. The workflow is identified by the UUID `b6f845bc-2d9c-43b2-8412-c81871c8bf89`.

---

## Table of Contents

1. [Read Operations](#read-operations)
2. [Create Operations](#create-operations)
3. [Update Operations](#update-operations)
4. [Delete Operations](#delete-operations)
5. [Special Operations](#special-operations)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)

---

## Read Operations

### 1. Fetch Assistants with Chats

**Endpoint**: `GET /assistants-with-chats/:userId`

**Purpose**: Load all assistants and chats for a user on login

**When Called**: When user successfully logs into the application

**Request**:
```http
GET /assistants-with-chats/1 HTTP/1.1
Host: n8n-test.brandgrowthos.ai
Content-Type: application/json
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
      "webhook": "https://n8n.brandgrowthos.ai/webhook/e4eeeae4-7f0d-4087-a20b-39f0efbb89d9/ava",
      "s2s_token": "agent_3aG65XzSJYI2sDFK2VqX",
      "code": "ava"
    }
  ],
  "chats": [
    {
      "id": 123,
      "assistant_id": 4,
      "user_id": 1,
      "title": "Project Discussion",
      "unread": 0
    }
  ]
}
```

**n8n Workflow**:
1. Select all assistants for user
2. Select all chats for user (sorted by ID)
3. Combine results into single response

**Frontend Mapping**:
```typescript
// src/types/AssistantWebhookMap.ts
export function mapAssistant(assistant: any): Assistant {
  return {
    id: assistant.id,
    userId: assistant.user_id,
    name: assistant.name,
    subtitle: assistant.subtitle,
    avatarUrl: assistant.avatar_url,
    webhookUrl: assistant.webhook,
    s2sToken: assistant.s2s_token,
    code: assistant.code,
  };
}
```

**Service**: `src/services/DatabaseSyncService.ts` - `useFetchAssistantsWithChatsQuery`

---

### 2. Fetch Chat History

**Endpoint**: `GET /chat-history/:userId/:chatId`

**Purpose**: Load the last 20 messages for a specific chat

**When Called**: When user clicks on a chat in the sidebar

**Request**:
```http
GET /chat-history/1/123 HTTP/1.1
Host: n8n-test.brandgrowthos.ai
Content-Type: application/json
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
      "sent_date": "2025-11-04T10:30:00.000Z",
      "text": "Hello, can you help me with this?",
      "local_id": 1,
      "has_attachment": false,
      "is_audio": false
    },
    {
      "id": 457,
      "chat_id": 123,
      "user_id": 1,
      "sender": "assistant",
      "sent_date": "2025-11-04T10:30:05.000Z",
      "text": "Of course! What do you need help with?",
      "local_id": 2,
      "has_attachment": false,
      "is_audio": false
    }
  ]
}
```

**SQL Query** (from n8n workflow):
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

**Side Effect**: Resets `unread` counter to 0 for this chat
```sql
UPDATE "AA_CHAT"
SET UNREAD = 0
WHERE USER_ID = '1' AND ID = '123';
```

**Service**: `src/services/DatabaseSyncService.ts` - `useFetchChatHistoryQuery`

---

### 3. Fetch Unread Messages

**Endpoint**: `GET /unread-messages/:userId`

**Purpose**: Get all chats with unread message counts

**When Called**: Periodically to show unread indicators in sidebar

**Request**:
```http
GET /unread-messages/1 HTTP/1.1
Host: n8n-test.brandgrowthos.ai
Content-Type: application/json
```

**Response**:
```json
{
  "unreadChats": [
    {
      "id": 123,
      "unread": 3
    },
    {
      "id": 456,
      "unread": 1
    }
  ]
}
```

**SQL Query**:
```sql
SELECT c.ID, c.UNREAD::INT
FROM "AA_CHAT" AS c
WHERE c.USER_ID = '1' AND c.UNREAD > 0;
```

**Service**: `src/services/FetchUnreadMessagesService.ts` - `fetchUnreadMessages`

---

## Create Operations

### 4. Create Assistant

**Endpoint**: `POST /assistants/:userId`

**Purpose**: Create a new assistant

**When Called**: When user clicks "New Assistant" in UI

**Request**:
```http
POST /assistants/1 HTTP/1.1
Host: n8n-test.brandgrowthos.ai
Content-Type: application/json

{
  "name": "Sales Assistant",
  "subtitle": "Helps with sales inquiries",
  "avatarUrl": "default2",
  "webhookUrl": "https://n8n.brandgrowthos.ai/webhook/sales-uuid-here",
  "s2sToken": "agent_abc123",
  "code": "sales"
}
```

**Response**:
```json
{
  "id": 10,
  "user_id": 1,
  "name": "Sales Assistant",
  "subtitle": "Helps with sales inquiries",
  "avatar_url": "default2",
  "webhook": "https://n8n.brandgrowthos.ai/webhook/sales-uuid-here",
  "s2s_token": "agent_abc123",
  "code": "sales"
}
```

**Service**: `src/services/AssistantCRUDService.ts` - `createAssistant`

---

### 5. Create Chat (with AI Title Generation)

**Endpoint**: `POST /:userId/chats`

**Purpose**: Create a new chat and auto-generate title using AI

**When Called**: When user sends first message to a blank chat

**Request**:
```http
POST /1/chats HTTP/1.1
Host: n8n-test.brandgrowthos.ai
Content-Type: application/json

{
  "chatFirstMessage": "hi ava",
  "assistantId": "4"
}
```

**n8n Workflow**:
1. Receive first message
2. Call OpenAI GPT-4.1-mini to generate title:
   ```javascript
   // System prompt:
   "Analyze the incoming text and come up with a topic title based on it.
   Come up with a short title up to 5 words long.
   Response only with this name and no more"

   // User message: "hi ava"
   // AI response: "Greeting Conversation"
   ```
3. Insert chat with generated title
4. Return new chat

**Response**:
```json
{
  "id": 789,
  "assistant_id": 4,
  "user_id": 1,
  "title": "Greeting Conversation",
  "unread": 0
}
```

**SQL Query**:
```sql
INSERT INTO "AA_CHAT"(ASSISTANT_ID, USER_ID, TITLE)
VALUES (
  COALESCE(
    4,
    (SELECT MAX(a.ID) FROM "AA_ASSISTANT" AS a WHERE a.user_id = 1)
  ),
  1,
  'Greeting Conversation'
)
RETURNING *;
```

**Note**: If `assistantId` is empty, uses the most recent assistant for the user.

**Service**: `src/services/DatabaseSyncService.ts` - `useAddChatMutation`

---

### 6. Create Chat (Simple)

**Endpoint**: `POST /:userId/chatstest`

**Purpose**: Create a new chat without AI title generation (fallback to "Chat topic")

**When Called**: Alternative endpoint for testing or simple chat creation

**Request**:
```http
POST /1/chatstest HTTP/1.1
Host: n8n-test.brandgrowthos.ai
Content-Type: application/json

{
  "assistantId": "4"
}
```

**Response**:
```json
{
  "id": 790,
  "assistant_id": 4,
  "user_id": 1,
  "title": "Chat topic",
  "unread": 0
}
```

**Service**: Not exposed in frontend services (test endpoint)

---

### 7. Insert Chat History (Bulk)

**Endpoint**: `POST /chat-history/:userId`

**Purpose**: Insert multiple chat messages at once (used after speech-to-speech)

**When Called**: When user ends a speech-to-speech conversation session

**Request**:
```http
POST /chat-history/1 HTTP/1.1
Host: n8n-test.brandgrowthos.ai
Content-Type: application/json

{
  "messages": [
    {
      "chatId": 123,
      "sender": "user",
      "text": "What's the weather like today?"
    },
    {
      "chatId": 123,
      "sender": "assistant",
      "text": "It's sunny with a high of 75°F."
    }
  ]
}
```

**n8n Workflow**:
1. Split array of messages
2. Insert each message individually with timestamp

**SQL Query** (per message):
```sql
INSERT INTO public."AA_CHAT_HISTORY" (
  chat_id,
  sender,
  sent_date,
  text,
  user_id
) VALUES (
  123,
  'user',
  '2025-11-04T10:30:00.000Z',
  'What\'s the weather like today?',
  1
);
```

**Service**: `src/services/ChatHistoryCRUDService.ts` - `saveChatHistory`

---

### 8. Assign Scheduled Chat

**Endpoint**: `POST /assign-scheduled/:userId/:chatId`

**Purpose**: Create a scheduled task for periodic assistant check-ins

**When Called**: When user selects "Add Schedule" for a chat in UI

**Request**:
```http
POST /assign-scheduled/1/123 HTTP/1.1
Host: n8n-test.brandgrowthos.ai
Content-Type: application/json

{
  "subject": "Daily weather update for London",
  "period": 24,
  "code": "ava"
}
```

**Parameters**:
- `subject`: Task prompt for the assistant
- `period`: Hours between executions (e.g., 24 = daily)
- `code`: Assistant code to route task to

**Response**:
```json
{
  "id": 10,
  "user_id": 1,
  "chat_id": 123,
  "subject": "Daily weather update for London",
  "period": 24,
  "next_call": "2025-11-05T10:30:00.000Z",
  "assistant_code": "ava"
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

**Service**: `src/services/ChatCRUDService.ts` - `assignScheduledChat`

---

## Update Operations

### 9. Update Assistant

**Endpoint**: `PUT /assistants/:userId/:assistantId`

**Purpose**: Update assistant details

**When Called**: When user edits an assistant in UI

**Request**:
```http
PUT /assistants/1/4 HTTP/1.1
Host: n8n-test.brandgrowthos.ai
Content-Type: application/json

{
  "name": "Ava Pro",
  "subtitle": "Enhanced Personal Assistant",
  "avatarUrl": "default1",
  "webhookUrl": "https://n8n.brandgrowthos.ai/webhook/e4eeeae4-7f0d-4087-a20b-39f0efbb89d9/ava",
  "s2sToken": "agent_3aG65XzSJYI2sDFK2VqX",
  "code": "ava"
}
```

**SQL Query**:
```sql
UPDATE "AA_ASSISTANT"
SET
  NAME = 'Ava Pro',
  AVATAR_URL = 'default1',
  WEBHOOK = 'https://n8n.brandgrowthos.ai/webhook/e4eeeae4-7f0d-4087-a20b-39f0efbb89d9/ava',
  SUBTITLE = 'Enhanced Personal Assistant',
  S2S_TOKEN = 'agent_3aG65XzSJYI2sDFK2VqX',
  CODE = 'ava'
WHERE USER_ID = '1' AND ID = '4';
```

**Service**: `src/services/AssistantCRUDService.ts` - `updateAssistant`

---

### 10. Rename Chat

**Endpoint**: `PATCH /chats/:userId/:chatId`

**Purpose**: Update chat title

**When Called**: When user selects "Rename" for a chat in UI

**Request**:
```http
PATCH /chats/1/123 HTTP/1.1
Host: n8n-test.brandgrowthos.ai
Content-Type: application/json

{
  "title": "Project Planning Discussion"
}
```

**SQL Query**:
```sql
UPDATE "AA_CHAT"
SET TITLE = 'Project Planning Discussion'
WHERE USER_ID = '1' AND ID = '123';
```

**Service**: `src/services/ChatCRUDService.ts` - `renameChat`

---

### 11. Increment Unread Messages

**Endpoint**: `PATCH /unread-messages/:userId`

**Purpose**: Increment unread counter when assistant sends a message

**When Called**: When assistant responds and user hasn't viewed the chat

**Request**:
```http
PATCH /unread-messages/1 HTTP/1.1
Host: n8n-test.brandgrowthos.ai
Content-Type: application/json

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

**Service**: Not directly called by frontend (triggered by assistant responses)

**Alternative Endpoint**: `POST /b6f845bc-2d9c-43b2-8412-c81871c8bf89/increment-unread`
- Same functionality, different path
- Used internally by n8n workflows

---

### 12. Rename New Chat (AI Title Generation)

**Endpoint**: `POST /:userId/rename-new-chat`

**Purpose**: Generate AI title for an existing chat

**When Called**: When user wants to rename an existing chat using AI

**Request**:
```http
POST /1/rename-new-chat HTTP/1.1
Host: n8n-test.brandgrowthos.ai
Content-Type: application/json

{
  "chatId": 123,
  "assistantId": 4,
  "chatFirstMessage": "Can you help me plan a marketing campaign?"
}
```

**n8n Workflow**:
1. Call OpenAI GPT-4.1-mini with message
2. Generate title (e.g., "Marketing Campaign Planning")
3. Update chat with new title

**Response**:
```json
{
  "name": "Marketing Campaign Planning",
  "user_id": 1,
  "chat_id": 123,
  "assistant_id": 4
}
```

**SQL Query**:
```sql
UPDATE "AA_CHAT"
SET TITLE = 'Marketing Campaign Planning'
WHERE ID = '123' AND assistant_id = '4';
```

**Service**: Not directly exposed in frontend (used internally)

---

## Delete Operations

### 13. Delete Assistant

**Endpoint**: `DELETE /assistants/:userId/:assistantId`

**Purpose**: Delete an assistant and all associated data

**When Called**: When user deletes an assistant in UI

**Request**:
```http
DELETE /assistants/1/4 HTTP/1.1
Host: n8n-test.brandgrowthos.ai
Content-Type: application/json
```

**Cascade Logic** (executed in order):
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

**Response**: Empty (204 No Content)

**Service**: `src/services/AssistantCRUDService.ts` - `deleteAssistant`

---

### 14. Delete Chat

**Endpoint**: `DELETE /chats/:userId/:chatId`

**Purpose**: Delete a chat and all associated messages

**When Called**: When user deletes a chat in UI

**Request**:
```http
DELETE /chats/1/123 HTTP/1.1
Host: n8n-test.brandgrowthos.ai
Content-Type: application/json
```

**Cascade Logic**:
```sql
-- Step 1: Delete all chat history
DELETE FROM "AA_CHAT_HISTORY"
WHERE USER_ID = '1' AND CHAT_ID = '123';

-- Step 2: Delete the chat
DELETE FROM "AA_CHAT"
WHERE USER_ID = '1' AND ID = '123';
```

**Response**: Empty (204 No Content)

**Service**: `src/services/ChatCRUDService.ts` - `deleteChat`

---

## Special Operations

### Scheduled Task Execution

**Trigger**: n8n Schedule Trigger (runs hourly)

**n8n Workflow**:
1. **Select Pending Tasks**:
   ```sql
   SELECT st.*
   FROM "AA_SCHEDULED_TASKS" st
   WHERE st.next_call < now()::timestamp;
   ```

2. **Loop Over Each Task**:
   - Update `next_call`:
     ```sql
     UPDATE "AA_SCHEDULED_TASKS"
     SET next_call = now() + ("period"::INT8 || ' hour')::interval,
         modified_date = now()
     WHERE id = '{{taskId}}';
     ```

3. **Route to Assistant Workflow**:
   - Uses Switch node to route based on `assistant_code`
   - Calls assistant-specific workflow (e.g., "Ava" workflow)
   - Passes `userId`, `chatId`, `subject` as parameters

4. **Save Assistant Response**:
   ```sql
   INSERT INTO "AA_CHAT_HISTORY"(chat_id, sender, sent_date, text, user_id, local_id)
   VALUES (123, 'assistant', NOW(), '{{aiResponse}}', 1, 1);
   ```

5. **Increment Unread Counter**:
   ```sql
   UPDATE "AA_CHAT"
   SET UNREAD = UNREAD + 1
   WHERE USER_ID = '1' AND ID = '123';
   ```

**Example Flow**:
```
Hourly Trigger
  → Select tasks where next_call < now()
  → For each task:
      → Update next_call (+24 hours)
      → Route to assistant (ava/erica/sales)
      → Get AI response
      → Insert message to chat
      → Increment unread counter
```

---

## Error Handling

### Standard Error Response
```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### Common Errors

| HTTP Code | Error | Cause |
|-----------|-------|-------|
| 400 | Bad Request | Invalid request body or parameters |
| 404 | Not Found | Resource doesn't exist (assistant, chat, etc.) |
| 500 | Internal Server Error | Database error or n8n workflow error |

**Note**: n8n workflows do not currently implement detailed error handling. Most errors return generic 500 responses.

---

## Rate Limiting

**Current Status**: No rate limiting implemented

**Recommendation**: Implement rate limiting per user:
- 100 requests per minute per user
- 1000 requests per hour per user
- Burst allowance: 200 requests

---

## Authentication

**Current Status**: No authentication on webhook endpoints

**Security Issue**: Webhooks are publicly accessible via UUID-based path

**Recommendation**: Implement one of:
1. **API Key**: Require `X-API-Key` header with user token
2. **JWT**: Require `Authorization: Bearer <token>` header
3. **Signed Requests**: HMAC-SHA256 signature verification

---

## Data Format Conventions

### Request/Response Format
- **Database**: snake_case (e.g., `user_id`, `avatar_url`)
- **Frontend**: camelCase (e.g., `userId`, `avatarUrl`)
- **Mapping**: Handled by `AssistantWebhookMap.ts` mappers

### Date Format
- **Database**: PostgreSQL `TIMESTAMP` (ISO 8601)
- **Frontend**: JavaScript `Date` or ISO string
- **Example**: `"2025-11-04T10:30:00.000Z"`

### Boolean Values
- **Database**: PostgreSQL `BOOLEAN` (true/false)
- **Frontend**: JavaScript `boolean`
- **SQL Cast**: `UNREAD::INT` to convert to integer

---

## Frontend Integration

### Electron IPC Communication
All webhook requests go through Electron's main process:

```typescript
// Preload script (src/preload.js)
window.electronAPI = {
  sendWebhookRequest: async (url, formDataObj) => {
    return await ipcRenderer.invoke('send-webhook-request', url, formDataObj);
  }
};

// Main process (main.js)
ipcMain.handle('send-webhook-request', async (event, url, formDataObj) => {
  // Convert FormData to fetch request
  // Send to n8n webhook
  // Return response
});
```

### Service Layer Pattern
```typescript
// src/services/ChatCRUDService.ts
export const renameChat = async (
  userId: string,
  chatId: string,
  newTitle: string
): Promise<void> => {
  const url = `${BASE_URL}/chats/${userId}/${chatId}`;
  const response = await window.electronAPI.sendWebhookRequest(url, {
    method: 'PATCH',
    body: JSON.stringify({ title: newTitle })
  });
  return response;
};
```

---

## Missing Endpoints (Frontend Features Not Implemented)

### 1. Starring Feature
```http
POST /assistants/:userId/:assistantId/star
DELETE /assistants/:userId/:assistantId/star
POST /chats/:userId/:chatId/star
DELETE /chats/:userId/:chatId/star
PATCH /assistants/:userId/star-order
PATCH /chats/:userId/star-order
```

### 2. Authentication
```http
POST /auth/login
POST /auth/logout
POST /auth/refresh
GET /users/me
PATCH /users/me
```

### 3. File Upload (Cloud Storage)
```http
POST /users/:userId/assistants/:assistantId/avatar
DELETE /users/:userId/assistants/:assistantId/avatar
POST /chat-history/:userId/:chatId/files
```

### 4. User Preferences
```http
GET /users/:userId/preferences
PATCH /users/:userId/preferences
```

---

## Performance Considerations

### Caching Recommendations
- Cache assistant list (invalidate on create/update/delete)
- Cache chat list (invalidate on create/delete)
- Don't cache chat history (always fresh)
- Don't cache unread counts (poll frequently)

### Pagination
Current implementation loads:
- All assistants (no pagination)
- All chats (no pagination)
- Last 20 messages (hardcoded limit)

**Recommendation**: Implement cursor-based pagination for chats and messages

### Batch Operations
**Missing**: No batch delete for chats (frontend deletes one at a time)

**Recommendation**: Add bulk delete endpoint:
```http
POST /chats/:userId/bulk-delete
Body: { "chatIds": [123, 456, 789] }
```

---

## Next Steps

1. **Add Authentication Endpoints**: Implement JWT-based authentication
2. **Add Starring Endpoints**: Sync frontend starring feature with database
3. **Add Cloud Storage Endpoints**: Replace base64 with file upload URLs
4. **Implement Rate Limiting**: Protect endpoints from abuse
5. **Add Pagination**: Support large datasets
6. **Add Batch Operations**: Improve efficiency for bulk actions
7. **Improve Error Handling**: Return detailed error messages
8. **Add Request Validation**: Validate all inputs before database operations

---

**For database schema details, see** `.claude/DATABASE_SCHEMA.md`
**For n8n workflow logic, see** `.claude/N8N_WORKFLOWS.md`
**For migration to Supabase, see** `.claude/SUPABASE_MIGRATION_PLAN.md`
