# AVA Assistant - PostgreSQL Database Schema

> **Last Updated**: November 4, 2025
> **Database**: PostgreSQL
> **Access**: Via n8n workflows
> **Schema**: `public`

---

## Overview

The AVA Assistant application uses a PostgreSQL database with 5 main tables organized around a user-centric hierarchy. All database operations are performed through n8n workflows using webhook endpoints.

**Data Flow**: Frontend (TypeScript/camelCase) ↔ n8n workflows ↔ PostgreSQL (snake_case)

---

## Entity Relationship Diagram

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

## Table Definitions

### 1. AA_USER

**Purpose**: Stores user accounts and profile information

**Status**: Referenced in workflows but not fully implemented. Currently using hardcoded authentication.

```sql
CREATE TABLE public."AA_USER" (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar VARCHAR(500),
    password_hash VARCHAR(255), -- NOT YET IMPLEMENTED
    role VARCHAR(100),           -- NOT YET IMPLEMENTED (work function)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,

    -- Preferences (NOT YET IMPLEMENTED)
    theme VARCHAR(10) DEFAULT 'dark',        -- 'dark' | 'light'
    language VARCHAR(10) DEFAULT 'en',       -- 'en' | 'fr' | etc.
    notifications BOOLEAN DEFAULT TRUE
);
```

**Columns**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | SERIAL | NO | AUTO | Primary key |
| `email` | VARCHAR(255) | NO | - | Unique user email |
| `name` | VARCHAR(255) | NO | - | Full name |
| `avatar` | VARCHAR(500) | YES | NULL | Avatar URL or base64 |
| `password_hash` | VARCHAR(255) | YES | NULL | Bcrypt hashed password (NOT IMPLEMENTED) |
| `role` | VARCHAR(100) | YES | NULL | Work function (NOT IMPLEMENTED) |
| `created_at` | TIMESTAMP | NO | NOW() | Account creation date |
| `last_login` | TIMESTAMP | YES | NULL | Last login timestamp |
| `is_active` | BOOLEAN | NO | TRUE | Account active status |
| `theme` | VARCHAR(10) | NO | 'dark' | UI theme preference |
| `language` | VARCHAR(10) | NO | 'en' | Language preference |
| `notifications` | BOOLEAN | NO | TRUE | Notifications enabled |

**Indexes**:
```sql
CREATE UNIQUE INDEX idx_aa_user_email ON public."AA_USER"(email);
CREATE INDEX idx_aa_user_active ON public."AA_USER"(is_active);
```

**Missing Features**:
- No password authentication (currently hardcoded)
- No session management
- No JWT token storage
- Preferences columns need to be added

---

### 2. AA_ASSISTANT

**Purpose**: Stores AI assistant configurations created by users

**Status**: Fully implemented in n8n workflows

```sql
CREATE TABLE public."AA_ASSISTANT" (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    avatar_url TEXT,
    webhook VARCHAR(500) NOT NULL,
    s2s_token VARCHAR(255),
    code VARCHAR(50) NOT NULL,
    agent_url_name VARCHAR(255), -- DEPRECATED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Frontend-only features (NOT YET IN DATABASE)
    is_starred BOOLEAN DEFAULT FALSE,
    star_order INTEGER,

    FOREIGN KEY (user_id) REFERENCES public."AA_USER"(id) ON DELETE CASCADE
);
```

**Columns**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | SERIAL | NO | AUTO | Primary key |
| `user_id` | INTEGER | NO | - | FK to AA_USER |
| `name` | VARCHAR(255) | NO | - | Assistant display name |
| `subtitle` | VARCHAR(255) | YES | NULL | Assistant description/tagline |
| `avatar_url` | TEXT | YES | NULL | Avatar image (base64 or URL) |
| `webhook` | VARCHAR(500) | NO | - | n8n webhook URL for this assistant |
| `s2s_token` | VARCHAR(255) | YES | NULL | Server-to-server auth token |
| `code` | VARCHAR(50) | NO | - | Unique code identifier (e.g., 'ava', 'erica') |
| `agent_url_name` | VARCHAR(255) | YES | NULL | DEPRECATED - no longer used |
| `created_at` | TIMESTAMP | NO | NOW() | Creation timestamp |
| `is_starred` | BOOLEAN | NO | FALSE | **NOT IMPLEMENTED** - User favorite flag |
| `star_order` | INTEGER | YES | NULL | **NOT IMPLEMENTED** - Sort order for favorites |

**Indexes**:
```sql
CREATE INDEX idx_aa_assistant_user_id ON public."AA_ASSISTANT"(user_id);
CREATE INDEX idx_aa_assistant_code ON public."AA_ASSISTANT"(code);
CREATE INDEX idx_aa_assistant_starred ON public."AA_ASSISTANT"(user_id, is_starred, star_order); -- Add when implementing
```

**Frontend Mapping**:
```typescript
// snake_case (DB) → camelCase (Frontend)
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

**Business Rules**:
- Each user can have multiple assistants
- Deleting an assistant cascades to delete all associated chats and chat history
- `code` field is used for routing scheduled tasks to correct assistant workflow
- `webhook` field stores the n8n workflow URL that processes this assistant's messages

---

### 3. AA_CHAT

**Purpose**: Stores conversation sessions between users and assistants

**Status**: Fully implemented in n8n workflows

```sql
CREATE TABLE public."AA_CHAT" (
    id SERIAL PRIMARY KEY,
    assistant_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    title VARCHAR(500),
    unread INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Frontend-only features (NOT YET IN DATABASE)
    is_starred BOOLEAN DEFAULT FALSE,
    star_order INTEGER,
    feedback_period TIMESTAMP,

    FOREIGN KEY (assistant_id) REFERENCES public."AA_ASSISTANT"(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES public."AA_USER"(id) ON DELETE CASCADE
);
```

**Columns**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | SERIAL | NO | AUTO | Primary key |
| `assistant_id` | INTEGER | NO | - | FK to AA_ASSISTANT |
| `user_id` | INTEGER | NO | - | FK to AA_USER |
| `title` | VARCHAR(500) | YES | NULL | Chat conversation title (AI-generated) |
| `unread` | INTEGER | NO | 0 | Number of unread messages |
| `created_at` | TIMESTAMP | NO | NOW() | Creation timestamp |
| `is_starred` | BOOLEAN | NO | FALSE | **NOT IMPLEMENTED** - User favorite flag |
| `star_order` | INTEGER | YES | NULL | **NOT IMPLEMENTED** - Sort order for favorites |
| `feedback_period` | TIMESTAMP | YES | NULL | **NOT IMPLEMENTED** - Scheduled feedback date |

**Indexes**:
```sql
CREATE INDEX idx_aa_chat_user_id ON public."AA_CHAT"(user_id);
CREATE INDEX idx_aa_chat_assistant_id ON public."AA_CHAT"(assistant_id);
CREATE INDEX idx_aa_chat_unread ON public."AA_CHAT"(user_id, unread) WHERE unread > 0;
CREATE INDEX idx_aa_chat_starred ON public."AA_CHAT"(user_id, is_starred, star_order); -- Add when implementing
```

**Business Rules**:
- Chat titles are automatically generated using OpenAI GPT-4.1-mini based on the first user message
- `unread` counter is incremented when assistant responds and user hasn't viewed the chat
- `unread` is reset to 0 when user opens the chat
- Deleting a chat cascades to delete all associated chat history

**Title Generation Logic** (from n8n workflow):
```javascript
// GPT-4.1-mini prompt:
"Analyze the incoming text and come up with a topic title based on it.
Come up with a short title up to 5 words long.
Response only with this name and no more"
```

---

### 4. AA_CHAT_HISTORY

**Purpose**: Stores individual messages in chat conversations

**Status**: Fully implemented in n8n workflows with extensive support for attachments

```sql
CREATE TABLE public."AA_CHAT_HISTORY" (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    sender VARCHAR(20) NOT NULL, -- 'user' | 'assistant'
    sent_date TIMESTAMP NOT NULL,
    text TEXT,
    local_id INTEGER,

    -- Audio message fields
    audio_file_name VARCHAR(255),
    audio_data TEXT,              -- Base64 encoded audio
    audio_mime_type VARCHAR(100),
    is_audio BOOLEAN DEFAULT FALSE,
    duration INTEGER,             -- Audio duration in seconds (NOT IN WORKFLOW)

    -- Attachment fields
    has_attachment BOOLEAN DEFAULT FALSE,
    files JSONB,                  -- Array of file objects
    is_mixed_attachments BOOLEAN DEFAULT FALSE,

    -- Artifact fields (Claude-style)
    artifact_code TEXT,
    is_code BOOLEAN DEFAULT FALSE,
    is_article BOOLEAN DEFAULT FALSE,
    article_text TEXT,
    is_multi_response BOOLEAN DEFAULT FALSE,

    -- Test field (should be removed)
    test_text TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (chat_id) REFERENCES public."AA_CHAT"(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES public."AA_USER"(id) ON DELETE CASCADE
);
```

**Columns**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | SERIAL | NO | AUTO | Primary key |
| `chat_id` | INTEGER | NO | - | FK to AA_CHAT |
| `user_id` | INTEGER | NO | - | FK to AA_USER |
| `sender` | VARCHAR(20) | NO | - | 'user' or 'assistant' |
| `sent_date` | TIMESTAMP | NO | - | Message timestamp |
| `text` | TEXT | YES | NULL | Message text content |
| `local_id` | INTEGER | YES | NULL | Client-side temp ID for optimistic updates |
| `audio_file_name` | VARCHAR(255) | YES | NULL | Audio file name |
| `audio_data` | TEXT | YES | NULL | Base64 encoded audio |
| `audio_mime_type` | VARCHAR(100) | YES | NULL | Audio MIME type (e.g., 'audio/webm') |
| `is_audio` | BOOLEAN | NO | FALSE | True if message contains audio |
| `duration` | INTEGER | YES | NULL | Audio duration in seconds |
| `has_attachment` | BOOLEAN | NO | FALSE | True if message has file attachments |
| `files` | JSONB | YES | NULL | Array of file objects (see structure below) |
| `is_mixed_attachments` | BOOLEAN | NO | FALSE | True if multiple file types |
| `artifact_code` | TEXT | YES | NULL | Code artifact content |
| `is_code` | BOOLEAN | NO | FALSE | True if message contains code artifact |
| `is_article` | BOOLEAN | NO | FALSE | True if message contains article |
| `article_text` | TEXT | YES | NULL | Article content |
| `is_multi_response` | BOOLEAN | NO | FALSE | True if response has multiple parts |
| `test_text` | TEXT | YES | NULL | **DEPRECATED** - Test column |
| `created_at` | TIMESTAMP | NO | NOW() | Creation timestamp |

**Files JSONB Structure**:
```json
[
  {
    "fileName": "document.pdf",
    "fileData": "base64_encoded_string",
    "fileMimeType": "application/pdf",
    "isVideo": false,
    "isImage": false,
    "isDocument": true,
    "isAudio": false
  }
]
```

**Indexes**:
```sql
CREATE INDEX idx_aa_chat_history_chat_id ON public."AA_CHAT_HISTORY"(chat_id, sent_date DESC);
CREATE INDEX idx_aa_chat_history_user_id ON public."AA_CHAT_HISTORY"(user_id);
CREATE INDEX idx_aa_chat_history_sender ON public."AA_CHAT_HISTORY"(sender);
CREATE INDEX idx_aa_chat_history_date ON public."AA_CHAT_HISTORY"(sent_date DESC);
```

**Business Rules**:
- Messages are loaded in batches of 20 (most recent first, then reversed for display)
- All files stored as base64 in database (inefficient - should migrate to cloud storage)
- Supports multiple attachment types: images, videos, documents, audio
- Artifacts follow Claude's pattern: code blocks and article blocks

**Chat History Query** (from n8n workflow):
```sql
SELECT *
FROM (
  SELECT *
  FROM "AA_CHAT_HISTORY"
  WHERE USER_ID = '{{userId}}' AND CHAT_ID = '{{chatId}}'
  ORDER BY SENT_DATE DESC
  LIMIT 20
) sub
ORDER BY SENT_DATE ASC;
```

---

### 5. AA_SCHEDULED_TASKS

**Purpose**: Stores periodic tasks for assistants to proactively reach out to users

**Status**: Fully implemented in n8n workflows with hourly cron execution

```sql
CREATE TABLE public."AA_SCHEDULED_TASKS" (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    chat_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    period INTEGER NOT NULL,        -- Hours between executions
    next_call TIMESTAMP NOT NULL,
    assistant_code VARCHAR(50) NOT NULL,
    modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES public."AA_USER"(id) ON DELETE CASCADE,
    FOREIGN KEY (chat_id) REFERENCES public."AA_CHAT"(id) ON DELETE CASCADE
);
```

**Columns**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | SERIAL | NO | AUTO | Primary key |
| `user_id` | INTEGER | NO | - | FK to AA_USER |
| `chat_id` | INTEGER | NO | - | FK to AA_CHAT where messages go |
| `subject` | TEXT | NO | - | Task description/prompt for assistant |
| `period` | INTEGER | NO | - | Hours between task executions |
| `next_call` | TIMESTAMP | NO | - | When task should execute next |
| `assistant_code` | VARCHAR(50) | NO | - | Which assistant handles this task |
| `modified_date` | TIMESTAMP | NO | NOW() | Last modification timestamp |
| `created_at` | TIMESTAMP | NO | NOW() | Creation timestamp |

**Indexes**:
```sql
CREATE INDEX idx_aa_scheduled_tasks_next_call ON public."AA_SCHEDULED_TASKS"(next_call) WHERE next_call < CURRENT_TIMESTAMP;
CREATE INDEX idx_aa_scheduled_tasks_user ON public."AA_SCHEDULED_TASKS"(user_id);
CREATE INDEX idx_aa_scheduled_tasks_code ON public."AA_SCHEDULED_TASKS"(assistant_code);
```

**Business Rules**:
- Tasks execute every hour via n8n Schedule Trigger
- When task executes:
  1. Assistant workflow is called with `subject` as prompt
  2. Response is saved to `chat_id` as assistant message
  3. `unread` counter is incremented
  4. `next_call` is updated: `NOW() + (period || ' hour')::interval`
- Task continues indefinitely until manually deleted
- `assistant_code` routes to correct assistant workflow (e.g., 'ava', 'erica')

**Update Next Call Query** (from n8n workflow):
```sql
UPDATE "AA_SCHEDULED_TASKS"
SET next_call = now() + ("period"::INT8 || ' hour')::interval,
    modified_date = now()
WHERE id = '{{taskId}}';
```

---

## Missing Columns (Frontend Features Not Yet in DB)

### Starring System
Both `AA_ASSISTANT` and `AA_CHAT` tables need:
```sql
-- Add to AA_ASSISTANT
ALTER TABLE public."AA_ASSISTANT"
ADD COLUMN is_starred BOOLEAN DEFAULT FALSE,
ADD COLUMN star_order INTEGER;

-- Add to AA_CHAT
ALTER TABLE public."AA_CHAT"
ADD COLUMN is_starred BOOLEAN DEFAULT FALSE,
ADD COLUMN star_order INTEGER;
```

Currently, starring is managed in frontend Redux state only (`UserSlice.preferences.starredAssistants` and `UserSlice.preferences.starredChats`).

---

## Data Types Reference

| SQL Type | TypeScript Type | Description |
|----------|----------------|-------------|
| SERIAL | number | Auto-increment integer |
| INTEGER | number | Standard integer |
| VARCHAR(n) | string | Variable-length string |
| TEXT | string | Unlimited length text |
| BOOLEAN | boolean | True/false |
| TIMESTAMP | Date/string | Date and time |
| JSONB | object/array | Binary JSON |

---

## Cascade Delete Behavior

```
Delete AA_USER
  └─> Cascades to AA_ASSISTANT
      └─> Cascades to AA_CHAT
          ├─> Cascades to AA_CHAT_HISTORY
          └─> Cascades to AA_SCHEDULED_TASKS

Delete AA_ASSISTANT
  └─> Manually deletes AA_CHAT_HISTORY first (in workflow)
      └─> Then deletes AA_CHAT
          └─> Then deletes AA_ASSISTANT
```

**n8n Delete Assistant Logic**:
```sql
-- Step 1: Delete all chat history for this assistant's chats
DELETE FROM "AA_CHAT_HISTORY"
WHERE USER_ID = '{{userId}}' AND CHAT_ID IN (
  SELECT ID FROM "AA_CHAT"
  WHERE USER_ID = '{{userId}}' AND ASSISTANT_ID = '{{assistantId}}'
);

-- Step 2: Delete all chats for this assistant
DELETE FROM "AA_CHAT"
WHERE USER_ID = '{{userId}}' AND ASSISTANT_ID = '{{assistantId}}';

-- Step 3: Delete the assistant
DELETE FROM "AA_ASSISTANT"
WHERE USER_ID = '{{userId}}' AND ID = '{{assistantId}}';
```

---

## Performance Optimization Recommendations

### 1. Add Indexes for Unread Messages
```sql
CREATE INDEX idx_aa_chat_unread_user ON public."AA_CHAT"(user_id, unread) WHERE unread > 0;
```

### 2. Add Composite Index for Chat History Loading
```sql
CREATE INDEX idx_aa_chat_history_load ON public."AA_CHAT_HISTORY"(chat_id, sent_date DESC);
```

### 3. Add Index for Scheduled Task Execution
```sql
CREATE INDEX idx_aa_scheduled_tasks_pending ON public."AA_SCHEDULED_TASKS"(next_call)
WHERE next_call < CURRENT_TIMESTAMP;
```

### 4. Partition AA_CHAT_HISTORY by Date
For large datasets, consider partitioning by month:
```sql
-- Example: Create monthly partitions
CREATE TABLE public."AA_CHAT_HISTORY_2025_11" PARTITION OF public."AA_CHAT_HISTORY"
FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
```

---

## Migration Scripts

### Add Starring Feature
```sql
-- Add columns to AA_ASSISTANT
ALTER TABLE public."AA_ASSISTANT"
ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS star_order INTEGER;

CREATE INDEX IF NOT EXISTS idx_aa_assistant_starred
ON public."AA_ASSISTANT"(user_id, is_starred, star_order);

-- Add columns to AA_CHAT
ALTER TABLE public."AA_CHAT"
ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS star_order INTEGER;

CREATE INDEX IF NOT EXISTS idx_aa_chat_starred
ON public."AA_CHAT"(user_id, is_starred, star_order);
```

### Add User Preferences
```sql
ALTER TABLE public."AA_USER"
ADD COLUMN IF NOT EXISTS theme VARCHAR(10) DEFAULT 'dark',
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS notifications BOOLEAN DEFAULT TRUE;
```

### Remove Deprecated Columns
```sql
ALTER TABLE public."AA_ASSISTANT" DROP COLUMN IF EXISTS agent_url_name;
ALTER TABLE public."AA_CHAT_HISTORY" DROP COLUMN IF EXISTS test_text;
```

---

## Connection Information

**Access Method**: Via n8n workflows (no direct client connection)
**n8n Postgres Credential**: "Postgres account" (ID: `deemRP1x5Z5wxU6M`)
**Schema**: `public`
**Character Set**: UTF-8
**Collation**: Default

**Note**: The frontend never directly accesses PostgreSQL. All database operations go through n8n webhook endpoints.

---

## Next Steps

1. **Implement Starring Feature**: Add `is_starred` and `star_order` columns with corresponding n8n endpoints
2. **Migrate to Cloud Storage**: Replace base64 file storage with AWS S3/Cloudinary
3. **Add Authentication**: Implement `password_hash` and session management
4. **Add User Preferences**: Store theme, language, notifications in database
5. **Optimize Queries**: Add recommended indexes for better performance
6. **Remove Deprecated Fields**: Clean up `agent_url_name` and `test_text`

---

**For API endpoint documentation, see** `.claude/API_ENDPOINTS.md`
**For n8n workflow details, see** `.claude/N8N_WORKFLOWS.md`
**For migration to Supabase, see** `.claude/SUPABASE_MIGRATION_PLAN.md`
