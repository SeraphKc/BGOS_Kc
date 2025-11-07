# AVA Assistant - n8n Workflows Documentation

> **Last Updated**: November 4, 2025
> **Platform**: n8n (Workflow Automation)
> **Deployment**: https://n8n-test.brandgrowthos.ai
> **Workflow Type**: Technical (Single workflow for all users)

---

## Overview

The AVA Assistant backend is entirely implemented as n8n workflows. All database operations, AI integrations, and scheduled tasks are orchestrated through webhook-triggered and time-triggered workflows.

**Key Workflow**: `b6f845bc-2d9c-43b2-8412-c81871c8bf89` (Main Technical Workflow)

---

## Architecture Principles

### Single Technical Workflow
- **ONE workflow serves ALL users**
- User isolation via `userId` parameter in URLs
- No per-user or per-company workflows
- Scalable through n8n's execution model

### Activation Requirements
To avoid conflicts:
1. Deactivate current workflow before activating new version
2. If webhook errors occur: Restart Docker
3. Only one instance should be active at a time

---

## Workflow Components

### 1. Webhook Nodes (14 total)

Each webhook represents an API endpoint accessible at:
```
https://n8n-test.brandgrowthos.ai/webhook/b6f845bc-2d9c-43b2-8412-c81871c8bf89/{endpoint}
```

**Categories**:
- **Read Operations** (3 webhooks): Fetch assistants, chats, chat history, unread messages
- **Create Operations** (5 webhooks): Create assistants, chats, messages, scheduled tasks
- **Update Operations** (4 webhooks): Update assistants, chats, increment unread
- **Delete Operations** (2 webhooks): Delete assistants, chats

### 2. PostgreSQL Nodes

**Connection**: "Postgres account" (ID: `deemRP1x5Z5wxU6M`)
**Operations**:
- `select` - Read data from tables
- `insert` - Create new records (via schema mapping)
- `executeQuery` - Raw SQL for complex operations (UPDATE, DELETE)

### 3. Code Nodes (JavaScript)

Used for data transformation:
```javascript
// Example: Combine chat list into single response
const chats = $input.all().map(i => i.json);
return [{ json: { chats: chats } }];
```

### 4. AI Integration Nodes

**Model**: OpenAI GPT-4.1-mini
**Credential**: "n8n-test" (ID: `Xp9BPHvoVunMr5gJ`)
**Purpose**: Auto-generate chat titles from first message

**System Prompt**:
```
Analyze the incoming text and come up with a topic title based on it.
Come up with a short title up to 5 words long.
Response only with this name and no more
```

**Settings**:
- Temperature: 0.1 (deterministic titles)
- Model: gpt-4.1-mini (fast, cost-effective)

### 5. Schedule Trigger

**Frequency**: Every hour
**Purpose**: Execute pending scheduled tasks

---

## Main Workflows

### Workflow 1: Load Assistants with Chats

**Trigger**: GET `/assistants-with-chats/:userId`
**When**: User logs into application

**Flow**:
```
Webhook
  ├─> Select Assistants (WHERE user_id = userId)
  │     └─> Code (combine to array)
  │
  └─> Select Chats (WHERE user_id = userId, ORDER BY id)
        └─> Code (combine to array)
              └─> Merge (combine both arrays)
                    └─> Respond to Webhook
```

**Output Format**:
```json
{
  "assistants": [...],
  "chats": [...]
}
```

---

### Workflow 2: Load Chat History

**Trigger**: GET `/chat-history/:userId/:chatId`
**When**: User clicks on a chat in sidebar

**Flow**:
```
Webhook
  ├─> Select ChatHistory (last 20 messages, reversed order)
  │     └─> Code (combine to array)
  │           └─> Respond to Webhook
  │
  └─> Update ChatUnread (SET unread = 0)
```

**SQL Logic**:
```sql
-- Get last 20 messages in descending order, then reverse
SELECT * FROM (
  SELECT * FROM "AA_CHAT_HISTORY"
  WHERE USER_ID = {{userId}} AND CHAT_ID = {{chatId}}
  ORDER BY SENT_DATE DESC
  LIMIT 20
) sub
ORDER BY SENT_DATE ASC;

-- Reset unread counter
UPDATE "AA_CHAT" SET UNREAD = 0
WHERE USER_ID = {{userId}} AND ID = {{chatId}};
```

---

### Workflow 3: Create Chat with AI Title

**Trigger**: POST `/:userId/chats`
**When**: User sends first message to blank chat

**Flow**:
```
Webhook
  └─> OpenAI GPT-4.1-mini (generate title from first message)
        └─> Code (prepare insert data)
              └─> Insert Chat (with AI-generated title)
                    └─> Respond to Webhook
```

**Example**:
```javascript
// Input: { chatFirstMessage: "hi ava", assistantId: "4" }
// AI Response: "Greeting Conversation"
// Insert SQL:
INSERT INTO "AA_CHAT"(ASSISTANT_ID, USER_ID, TITLE)
VALUES (
  COALESCE(4, (SELECT MAX(a.ID) FROM "AA_ASSISTANT" WHERE a.user_id = 1)),
  1,
  'Greeting Conversation'
) RETURNING *;
```

**Fallback**: If `assistantId` is empty, uses most recent assistant for user.

---

### Workflow 4: Create Assistant

**Trigger**: POST `/assistants/:userId`
**When**: User clicks "New Assistant" in UI

**Flow**:
```
Webhook
  └─> Insert Assistant (schema mapping)
        └─> Respond to Webhook
```

**Schema Mapping**:
```javascript
{
  user_id: "={{$json.params.userId}}",
  name: "={{ $json.body.name }}",
  avatar_url: "={{ $json.body.avatarUrl }}",
  webhook: "={{ $json.body.webhookUrl }}",
  subtitle: "={{ $json.body.subtitle }}",
  s2s_token: "={{ $json.body.s2sToken }}",
  code: "={{ $json.body.code }}"
}
```

---

### Workflow 5: Update Assistant

**Trigger**: PUT `/assistants/:userId/:assistantId`
**When**: User edits assistant in UI

**Flow**:
```
Webhook
  └─> Update Assistant (executeQuery with raw SQL)
        └─> Respond to Webhook
```

**SQL**:
```sql
UPDATE "AA_ASSISTANT"
SET
  NAME = '{{ $json.body.name }}',
  AVATAR_URL = '{{ $json.body.avatarUrl }}',
  WEBHOOK = '{{ $json.body.webhookUrl }}',
  SUBTITLE = '{{ $json.body.subtitle }}',
  S2S_TOKEN = '{{ $json.body.s2sToken }}',
  CODE = '{{ $json.body.code }}'
WHERE USER_ID = '{{$json.params.userId}}'
  AND ID = '{{$json.params.assistantId}}';
```

---

### Workflow 6: Delete Assistant (Cascade)

**Trigger**: DELETE `/assistants/:userId/:assistantId`
**When**: User deletes assistant in UI

**Flow**:
```
Webhook
  └─> Delete Assistant (3-step cascading delete)
        └─> No response needed
```

**Cascade SQL** (all in one executeQuery):
```sql
-- Step 1: Delete all chat history for this assistant
DELETE FROM "AA_CHAT_HISTORY"
WHERE USER_ID = '{{userId}}' AND CHAT_ID IN (
  SELECT ID FROM "AA_CHAT"
  WHERE USER_ID = '{{userId}}' AND ASSISTANT_ID = '{{assistantId}}'
);

-- Step 2: Delete all chats
DELETE FROM "AA_CHAT"
WHERE USER_ID = '{{userId}}' AND ASSISTANT_ID = '{{assistantId}}';

-- Step 3: Delete assistant
DELETE FROM "AA_ASSISTANT"
WHERE USER_ID = '{{userId}}' AND ID = '{{assistantId}}';
```

---

### Workflow 7: Delete Chat (Cascade)

**Trigger**: DELETE `/chats/:userId/:chatId`
**When**: User deletes chat in UI

**Flow**:
```
Webhook
  └─> Delete Chat (2-step cascading delete)
```

**SQL**:
```sql
DELETE FROM "AA_CHAT_HISTORY"
WHERE USER_ID = '{{userId}}' AND CHAT_ID = '{{chatId}}';

DELETE FROM "AA_CHAT"
WHERE USER_ID = '{{userId}}' AND ID = '{{chatId}}';
```

---

### Workflow 8: Rename Chat

**Trigger**: PATCH `/chats/:userId/:chatId`
**When**: User renames chat in UI

**Flow**:
```
Webhook
  └─> Rename Chat Name (UPDATE title)
        └─> Respond to Webhook
```

---

### Workflow 9: Insert Chat History (Bulk)

**Trigger**: POST `/chat-history/:userId`
**When**: User ends speech-to-speech session

**Flow**:
```
Webhook
  └─> Split Out (split messages array)
        └─> Insert Chat Message (for each message)
              └─> Respond to Webhook
```

**Split Logic**:
```javascript
// Input: { messages: [...] }
// Output: Each message as separate execution
```

---

### Workflow 10: Fetch Unread Messages

**Trigger**: GET `/unread-messages/:userId`
**When**: Frontend polls for unread indicators

**Flow**:
```
Webhook
  └─> Select UnreadMessages (WHERE unread > 0)
        └─> Code (combine to array)
              └─> Respond to Webhook
```

**SQL**:
```sql
SELECT c.ID, c.UNREAD::INT
FROM "AA_CHAT" AS c
WHERE c.USER_ID = '{{userId}}' AND c.UNREAD > 0;
```

---

### Workflow 11: Increment Unread Messages

**Trigger**: PATCH `/unread-messages/:userId`
**When**: Assistant sends message while user isn't viewing chat

**Flow**:
```
Webhook
  └─> Increment Unread (UPDATE unread = unread + 1)
```

**SQL**:
```sql
UPDATE "AA_CHAT"
SET UNREAD = UNREAD + 1
WHERE USER_ID = '{{userId}}' AND ID = '{{chatId}}';
```

---

### Workflow 12: Assign Scheduled Task

**Trigger**: POST `/assign-scheduled/:userId/:chatId`
**When**: User adds scheduled task to chat

**Flow**:
```
Webhook
  └─> Insert Scheduled Task
```

**SQL**:
```sql
INSERT INTO "AA_SCHEDULED_TASKS"(
  USER_ID, CHAT_ID, SUBJECT, PERIOD, NEXT_CALL, ASSISTANT_CODE
) VALUES (
  '{{userId}}',
  '{{chatId}}',
  '{{subject}}',
  '{{period}}',
  (now() + ('{{period}}'::INT8 || ' hour')::interval),
  '{{code}}'
) RETURNING *;
```

---

### Workflow 13: Scheduled Task Execution (Cron)

**Trigger**: Schedule Trigger (every hour)
**Purpose**: Execute pending scheduled tasks

**Flow**:
```
Schedule Trigger (hourly)
  └─> Select Scheduled Tasks (WHERE next_call < now())
        └─> Loop Over Items (process each task)
              ├─> Update Next Call (+period hours)
              │
              └─> Switch (route by assistant_code)
                    └─> Execute Workflow (call assistant-specific workflow)
                          └─> Code (prepare response)
                                ├─> Insert OutputChatMessage
                                │
                                └─> Increment Unread Messages
                                      └─> Merge
                                            └─> Loop (continue to next task)
```

**SQL Logic**:
```sql
-- Select pending tasks
SELECT st.* FROM "AA_SCHEDULED_TASKS" st
WHERE st.next_call < now()::timestamp;

-- Update next call time
UPDATE "AA_SCHEDULED_TASKS"
SET next_call = now() + ("period"::INT8 || ' hour')::interval,
    modified_date = now()
WHERE id = '{{taskId}}';

-- Insert assistant response
INSERT INTO "AA_CHAT_HISTORY"(
  chat_id, sender, sent_date, text, user_id, local_id
) VALUES (
  {{chatId}}, 'assistant', NOW(), '{{aiResponse}}', {{userId}}, 1
);

-- Increment unread
UPDATE "AA_CHAT" SET UNREAD = UNREAD + 1
WHERE USER_ID = '{{userId}}' AND ID = '{{chatId}}';
```

**Routing Example**:
```javascript
// Switch node routes to assistant workflow
if (assistant_code === 'ava') {
  executeWorkflow('48aZciARg5wvEqmi'); // Ava workflow
}
```

**Workflow Input**:
```json
{
  "userId": "1",
  "chatId": "123",
  "subject": "Daily weather update for London"
}
```

---

## Data Transformation Patterns

### 1. Snake_case → camelCase

**Database** (snake_case):
```json
{
  "user_id": 1,
  "avatar_url": "default1",
  "s2s_token": "abc123"
}
```

**Frontend** (camelCase):
```json
{
  "userId": 1,
  "avatarUrl": "default1",
  "s2sToken": "abc123"
}
```

**Mapping Function** (in frontend):
```typescript
// src/types/AssistantWebhookMap.ts
export function mapAssistant(assistant: any): Assistant {
  return {
    id: assistant.id,
    userId: assistant.user_id,
    avatarUrl: assistant.avatar_url,
    webhookUrl: assistant.webhook,
    s2sToken: assistant.s2s_token,
    code: assistant.code
  };
}
```

### 2. Array Aggregation

**Pattern**: Combine multiple database rows into single array response

```javascript
// Code node pattern
const items = $input.all().map(i => i.json);
return [{ json: { items: items } }];
```

**Example**:
```javascript
// Input: Multiple execution items
[
  { json: { id: 1, name: "Ava" } },
  { json: { id: 2, name: "Erica" } }
]

// Output: Single execution item with array
[
  {
    json: {
      assistants: [
        { id: 1, name: "Ava" },
        { id: 2, name: "Erica" }
      ]
    }
  }
]
```

### 3. Conditional Insert

**Pattern**: Use COALESCE to provide fallback values

```sql
INSERT INTO "AA_CHAT"(ASSISTANT_ID, USER_ID, TITLE)
VALUES (
  COALESCE(
    {{ $json.body.assistantId }},
    (SELECT MAX(a.ID) FROM "AA_ASSISTANT" WHERE a.user_id = {{ $json.user_id }})
  ),
  {{ $json.user_id }},
  '{{ $json.name }}'
);
```

If `assistantId` is null/empty, uses latest assistant.

---

## Error Handling

### Current State
- **Limited error handling** in workflows
- Most errors return generic 500 responses
- n8n built-in error catching

### Recommendations

**Add Error Handling Nodes**:
```
Node
  └─> On Error → IF Node
                    ├─> SQL Error → Respond 400 (Bad Request)
                    ├─> Not Found → Respond 404
                    └─> Unknown → Respond 500 (Internal Error)
```

**Validation Examples**:
```javascript
// Validate user exists
const user = $('validateUser').first().json;
if (!user || user.length === 0) {
  return [{ json: { error: "User not found" }, statusCode: 404 }];
}
```

---

## Performance Optimization

### Current Bottlenecks

1. **No Query Optimization**
   - No indexes on foreign keys
   - Full table scans for unread messages
   - No pagination for chat history

2. **Sequential Processing**
   - Delete operations execute SQL sequentially
   - Could batch in single transaction

3. **AI Title Generation Latency**
   - Every chat creation waits for OpenAI response
   - ~1-2 second delay

### Recommendations

**1. Add Database Indexes**:
```sql
CREATE INDEX idx_chat_user_unread ON "AA_CHAT"(user_id, unread) WHERE unread > 0;
CREATE INDEX idx_chat_history_chat_date ON "AA_CHAT_HISTORY"(chat_id, sent_date DESC);
```

**2. Batch SQL Operations**:
```sql
-- Use BEGIN/COMMIT for cascade deletes
BEGIN;
DELETE FROM "AA_CHAT_HISTORY" WHERE ...;
DELETE FROM "AA_CHAT" WHERE ...;
DELETE FROM "AA_ASSISTANT" WHERE ...;
COMMIT;
```

**3. Async Title Generation**:
- Create chat immediately with "New Chat" title
- Generate AI title asynchronously
- Update title when ready

---

## Monitoring & Debugging

### n8n Execution Logs
- Access at: https://n8n-test.brandgrowthos.ai/workflows
- View execution history per workflow
- Inspect input/output for each node

### Common Debug Patterns

**1. Pinned Data** (for testing):
```json
// updateAssistant webhook has pinned test data
{
  "params": { "userId": "2", "assistantId": "51" },
  "body": { "name": "Ava", ... }
}
```

**2. Always Output Data**:
- Nodes like "Select Assistants" have `alwaysOutputData: true`
- Ensures downstream nodes receive data even on empty results

---

## Docker Deployment

### Restart Procedure
If webhook conflicts occur:
```bash
# Restart Docker to reset webhook registrations
docker restart n8n-container

# Then reactivate workflow
```

### Configuration
- Environment: Production mode
- Auto-start: Disabled (manual activation required)
- Credentials: Stored in n8n credential manager

---

## Future Multi-Company Support

### Current State
- Single workflow serves all users
- No company isolation

### Recommended Approach
```sql
-- Add to AA_USER table
ALTER TABLE "AA_USER" ADD COLUMN company_name VARCHAR(255);

-- Filter by company in workflows
WHERE user_id = {{userId}} AND company_name = {{companyName}}
```

**Alternative**: Create separate workflow per company
- Pros: Complete isolation, custom logic per company
- Cons: Harder to maintain, duplicate workflows

---

## Security Considerations

### Current Vulnerabilities

1. **No Authentication**
   - Webhooks are publicly accessible
   - Only protection is obscure UUID path

2. **SQL Injection Risk**
   - Raw string interpolation in executeQuery nodes
   - Example: `'{{ $json.body.title }}'` → vulnerable

3. **No Input Validation**
   - No checks for valid userId, chatId, etc.
   - Could access other users' data

### Recommendations

**1. Add API Key Validation**:
```javascript
// In each webhook
const apiKey = $json.headers['x-api-key'];
if (apiKey !== 'expected_key') {
  return [{ json: { error: "Unauthorized" }, statusCode: 401 }];
}
```

**2. Use Parameterized Queries**:
```javascript
// Instead of raw interpolation
query: `UPDATE "AA_CHAT" SET TITLE = '{{ $json.body.title }}'`

// Use n8n schema mapping with escaping
columns: {
  mappingMode: "defineBelow",
  value: { title: "={{ $json.body.title }}" }
}
```

**3. Validate User Ownership**:
```sql
-- Always check user_id in WHERE clause
UPDATE "AA_CHAT"
SET TITLE = {{title}}
WHERE ID = {{chatId}} AND USER_ID = {{userId}};
```

---

## Testing Workflows

### Manual Testing via n8n UI
1. Use "Execute Workflow" button
2. View node executions
3. Inspect JSON output

### Automated Testing
- **Not currently implemented**
- Recommendation: Use n8n API to trigger test executions

---

## Webhook URL Structure

**Format**:
```
https://n8n-test.brandgrowthos.ai/webhook/{workflow_id}/{endpoint}
```

**Example**:
```
https://n8n-test.brandgrowthos.ai/webhook/b6f845bc-2d9c-43b2-8412-c81871c8bf89/assistants/1
```

**Components**:
- `workflow_id`: `b6f845bc-2d9c-43b2-8412-c81871c8bf89` (constant)
- `endpoint`: Varies by webhook node path configuration

---

## Next Steps

1. **Add Error Handling**: Implement IF nodes for validation
2. **Add Authentication**: Require API keys or JWT tokens
3. **Optimize SQL**: Add indexes, use parameterized queries
4. **Add Monitoring**: Set up alerts for failed executions
5. **Document Workflows**: Add sticky notes to explain each section
6. **Version Control**: Export workflow JSON to Git
7. **Add Tests**: Create test workflow with sample data

---

**For database schema, see** `.claude/DATABASE_SCHEMA.md`
**For API endpoint details, see** `.claude/API_ENDPOINTS.md`
**For Supabase migration, see** `.claude/SUPABASE_MIGRATION_PLAN.md`
