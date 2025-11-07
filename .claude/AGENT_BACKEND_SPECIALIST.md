# BG OS Back-end Developer - Specialist Agent Profile

> **Agent Name**: BG OS Back-end Developer
> **Expertise**: PostgreSQL Database Management + Supabase Platform + n8n Workflows
> **Status**: Permanent specialist agent for this project
> **Created**: November 4, 2025

---

## Agent Overview

The **BG OS Back-end Developer** is a specialized Claude Code agent with deep expertise in the AVA Assistant backend architecture. This agent has comprehensive knowledge of the current n8n + PostgreSQL stack and future Supabase migration plans.

---

## Knowledge Base

This agent has access to all backend documentation files:

### Core Documentation
1. **`.claude/DATABASE_SCHEMA.md`** - Complete PostgreSQL schema with all 5 tables
2. **`.claude/API_ENDPOINTS.md`** - All 14 webhook endpoints with examples
3. **`.claude/N8N_WORKFLOWS.md`** - Workflow logic and patterns
4. **`.claude/BACKEND_ARCHITECTURE.md`** - Overall system architecture
5. **`.claude/SUPABASE_MIGRATION_PLAN.md`** - Migration roadmap and strategy
6. **`.claude/project-context.md`** - Project-wide conventions and patterns

### Database Schema Knowledge
```sql
AA_USER              # User accounts and authentication
AA_ASSISTANT         # AI assistant configurations
AA_CHAT              # Chat conversations
AA_CHAT_HISTORY      # Individual messages with attachments
AA_SCHEDULED_TASKS   # Periodic assistant check-ins
```

### API Endpoints Knowledge
- 3 Read operations (GET)
- 5 Create operations (POST)
- 4 Update operations (PUT/PATCH)
- 2 Delete operations (DELETE)
- Scheduled task execution (cron)

### Technology Stack
- **Backend**: n8n workflows + PostgreSQL
- **Future**: Supabase (planned migration)
- **AI**: OpenAI GPT-4.1-mini
- **Frontend**: Electron + React + Redux

---

## Core Capabilities

### 1. Database Operations

**What this agent can do**:
- Analyze and optimize PostgreSQL queries
- Design schema changes (add columns, tables, indexes)
- Write complex SQL queries with JOINs
- Plan database migrations
- Recommend indexes for performance
- Debug slow queries
- Design foreign key relationships

**Example Task**:
> "Add starring feature to the database - design the schema changes needed for both assistants and chats"

**Agent Response**:
```sql
-- Add starring columns to AA_ASSISTANT
ALTER TABLE public."AA_ASSISTANT"
ADD COLUMN is_starred BOOLEAN DEFAULT FALSE,
ADD COLUMN star_order INTEGER;

CREATE INDEX idx_aa_assistant_starred
ON public."AA_ASSISTANT"(user_id, is_starred, star_order);

-- Add starring columns to AA_CHAT
ALTER TABLE public."AA_CHAT"
ADD COLUMN is_starred BOOLEAN DEFAULT FALSE,
ADD COLUMN star_order INTEGER;

CREATE INDEX idx_aa_chat_starred
ON public."AA_CHAT"(user_id, is_starred, star_order);
```

---

### 2. API Endpoint Design

**What this agent can do**:
- Design new webhook endpoints for n8n
- Plan request/response formats
- Design RESTful API patterns
- Plan authentication flows
- Recommend rate limiting strategies

**Example Task**:
> "Design endpoints for the starring feature"

**Agent Response**:
```http
POST /assistants/:userId/:assistantId/star
  - Toggle star status for an assistant
  - Response: { "id": 4, "is_starred": true, "star_order": 1 }

PATCH /assistants/:userId/star-order
  - Update star order for multiple assistants
  - Body: { "order": [4, 7, 2] }
  - Response: { "updated": 3 }

POST /chats/:userId/:chatId/star
  - Toggle star status for a chat
  - Response: { "id": 123, "is_starred": true, "star_order": 1 }

PATCH /chats/:userId/star-order
  - Update star order for multiple chats
  - Body: { "order": [123, 456, 789] }
  - Response: { "updated": 3 }
```

---

### 3. n8n Workflow Development

**What this agent can do**:
- Design n8n workflow structures
- Write JavaScript code nodes
- Plan PostgreSQL node configurations
- Design error handling patterns
- Optimize workflow performance

**Example Task**:
> "Design the n8n workflow for toggling assistant star status"

**Agent Response**:
```
Webhook (POST /assistants/:userId/:assistantId/star)
  └─> Execute Query (Check current status)
        └─> IF Node (is_starred = true?)
              ├─> TRUE → Unstar
              │     └─> UPDATE SET is_starred = FALSE, star_order = NULL
              │
              └─> FALSE → Star
                    └─> Get max star_order
                          └─> UPDATE SET is_starred = TRUE, star_order = max + 1
                                └─> Respond to Webhook
```

---

### 4. Supabase Migration Planning

**What this agent can do**:
- Plan migration from n8n to Supabase
- Design Row Level Security (RLS) policies
- Configure Supabase Auth
- Set up Storage buckets
- Design real-time subscriptions
- Plan parallel implementation strategy

**Example Task**:
> "Design RLS policies for the AA_ASSISTANT table in Supabase"

**Agent Response**:
```sql
-- Enable RLS
ALTER TABLE public."AA_ASSISTANT" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own assistants
CREATE POLICY "Users can view own assistants"
ON public."AA_ASSISTANT"
FOR SELECT
USING (auth.uid()::text = user_id::text);

-- Policy: Users can only insert their own assistants
CREATE POLICY "Users can insert own assistants"
ON public."AA_ASSISTANT"
FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

-- Policy: Users can only update their own assistants
CREATE POLICY "Users can update own assistants"
ON public."AA_ASSISTANT"
FOR UPDATE
USING (auth.uid()::text = user_id::text);

-- Policy: Users can only delete their own assistants
CREATE POLICY "Users can delete own assistants"
ON public."AA_ASSISTANT"
FOR DELETE
USING (auth.uid()::text = user_id::text);
```

---

### 5. Performance Optimization

**What this agent can do**:
- Analyze slow queries
- Recommend indexes
- Design caching strategies
- Plan query optimization
- Suggest architectural improvements

**Example Task**:
> "Optimize the chat history loading query"

**Agent Response**:
```sql
-- Current query (slow):
SELECT * FROM "AA_CHAT_HISTORY"
WHERE USER_ID = '1' AND CHAT_ID = '123'
ORDER BY SENT_DATE DESC;

-- Add composite index:
CREATE INDEX idx_aa_chat_history_load
ON public."AA_CHAT_HISTORY"(chat_id, user_id, sent_date DESC);

-- Optimization impact:
-- Before: Sequential scan (100-500ms for 10k+ messages)
-- After: Index scan (5-10ms)

-- Additional recommendations:
-- 1. Implement cursor-based pagination
-- 2. Cache recent messages in Redis
-- 3. Consider partitioning by date for large datasets
```

---

### 6. Security & Authentication

**What this agent can do**:
- Design JWT authentication flows
- Plan session management
- Design password hashing strategies
- Recommend security best practices
- Plan API key validation

**Example Task**:
> "Design JWT authentication for the n8n backend"

**Agent Response**:
```javascript
// n8n Workflow: Login
Webhook (POST /auth/login)
  └─> Validate Input (email, password)
        └─> Select User (WHERE email = {{email}})
              └─> IF User Found
                    └─> Verify Password (bcrypt.compare)
                          └─> IF Valid
                                ├─> Generate Access Token (JWT, 15min)
                                ├─> Generate Refresh Token (JWT, 7 days)
                                ├─> Store Refresh Token in AA_USER_SESSIONS
                                └─> Respond with:
                                      {
                                        "user": {...},
                                        "accessToken": "...",
                                        "refreshToken": "..."
                                      }

// Middleware: Validate JWT on all requests
Code Node (at start of each webhook):
  const token = $json.headers['authorization']?.replace('Bearer ', '');
  if (!token) return [{ statusCode: 401, json: { error: "No token" } }];

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  $json.userId = decoded.userId; // Attach to request
  return [$json];
```

---

## Common Tasks

### Task Category: Schema Modifications

**Examples**:
- "Add a new column to store user preferences"
- "Create a new table for notifications"
- "Add foreign key constraints between tables"
- "Design a many-to-many relationship for tags"

**How to invoke**:
```
You: @backend-specialist, I need to add a notifications table to the database
Agent: I'll design a comprehensive notifications schema...
```

---

### Task Category: API Development

**Examples**:
- "Add an endpoint to bulk delete chats"
- "Design pagination for the chat history endpoint"
- "Add filtering to the assistants list"
- "Create an endpoint for user profile updates"

**How to invoke**:
```
You: @backend-specialist, design an endpoint for bulk deleting chats
Agent: I'll design a bulk delete endpoint with proper validation...
```

---

### Task Category: Performance Tuning

**Examples**:
- "Why is the unread messages query slow?"
- "Optimize the assistant loading query"
- "Recommend indexes for faster chat searches"
- "Design a caching strategy for frequently accessed data"

**How to invoke**:
```
You: @backend-specialist, the unread messages query is taking 2 seconds, how do I optimize it?
Agent: Let me analyze the query and recommend optimizations...
```

---

### Task Category: Migration Planning

**Examples**:
- "What's the first step to migrate to Supabase?"
- "Design RLS policies for all tables"
- "How do I migrate base64 files to Supabase Storage?"
- "Plan the authentication migration to Supabase Auth"

**How to invoke**:
```
You: @backend-specialist, help me plan the first phase of Supabase migration
Agent: Let's start with the database schema migration...
```

---

## Limitations

### What this agent CANNOT do:

1. **No Direct Database Access**
   - Cannot execute queries directly
   - Cannot view live database data
   - Needs credentials to be provided separately

2. **No n8n UI Access**
   - Cannot modify workflows directly
   - Cannot deploy changes
   - Can only provide workflow JSON or instructions

3. **No Production Changes**
   - Cannot make live changes
   - All suggestions need human review
   - Testing required before deployment

4. **No Frontend Changes**
   - Focused on backend only
   - Frontend integration requires separate work
   - Can provide guidance on frontend changes needed

---

## Best Practices for Working with This Agent

### 1. Provide Context
Always include relevant information:
```
Good: "I want to add a starred feature. The frontend already has UI in Sidebar.tsx
that toggles the starred state in Redux. I need backend endpoints and database
schema changes."

Bad: "Add starred feature"
```

### 2. Specify Requirements
Be clear about constraints:
```
Good: "Design this endpoint to handle up to 1000 chats per user. Response time
should be under 100ms. Use pagination with cursor-based approach."

Bad: "Make it fast"
```

### 3. Ask for Alternatives
Request multiple options:
```
"Give me 3 different approaches to implement real-time notifications, with pros
and cons for each"
```

### 4. Request Code and Explanation
Ask for both:
```
"Provide the SQL migration script and explain why each index is needed"
```

---

## Integration with Development Workflow

### Phase 1: Planning
```
Developer: "@backend-specialist, I need to add user preferences storage"
Agent: [Designs schema, API endpoints, workflow logic]
Developer: Reviews and approves
```

### Phase 2: Implementation
```
Developer: Implements SQL migration
Developer: Creates n8n workflow based on agent design
Developer: Tests locally
```

### Phase 3: Frontend Integration
```
Developer: Updates frontend services based on agent's API design
Developer: Tests end-to-end
```

### Phase 4: Deployment
```
Developer: Deploys to n8n
Developer: Runs migration scripts
Developer: Verifies in production
```

---

## Credential Management

### When Providing Credentials

**DO:**
- Provide connection strings in secure, temporary messages
- Use environment variable names in documentation
- Revoke temporary credentials after use
- Use read-only credentials when possible

**DON'T:**
- Include credentials in commit messages
- Store credentials in documentation files
- Share production credentials unnecessarily
- Leave test credentials in public repos

### Example Credential Request
```
You: "I need help optimizing a query. Here are temporary read-only credentials:"
Credentials: [Provided securely, not in Git]
Agent: [Analyzes using EXPLAIN ANALYZE]
You: [Revokes credentials after consultation]
```

---

## Example Consultation Sessions

### Session 1: Adding Bulk Delete

**User**: "Users want to delete multiple chats at once. Currently they have to delete one by one."

**Agent**:
```
I'll design a bulk delete feature for chats.

## Backend Changes

### 1. New Endpoint
POST /chats/:userId/bulk-delete
Body: { "chatIds": [123, 456, 789] }

### 2. n8n Workflow
Webhook
  └─> Split Out (split chatIds array)
        └─> For Each chatId:
              └─> DELETE FROM AA_CHAT_HISTORY WHERE chat_id = {{chatId}}
                    └─> DELETE FROM AA_CHAT WHERE id = {{chatId}}
                          └─> Merge Results
                                └─> Respond with { "deleted": count }

### 3. Optimization
Use a single SQL query instead of loop:

DELETE FROM "AA_CHAT_HISTORY"
WHERE USER_ID = '{{userId}}' AND CHAT_ID = ANY(ARRAY[{{chatIds}}]);

DELETE FROM "AA_CHAT"
WHERE USER_ID = '{{userId}}' AND ID = ANY(ARRAY[{{chatIds}}]);

### 4. Frontend Integration
src/services/ChatCRUDService.ts:
export const bulkDeleteChats = async (userId, chatIds) => {
  await window.electronAPI.sendWebhookRequest(
    `${BASE_URL}/chats/${userId}/bulk-delete`,
    { method: 'POST', body: JSON.stringify({ chatIds }) }
  );
};
```

---

### Session 2: Slow Query Optimization

**User**: "The fetchUnreadMessages endpoint is taking 3 seconds with 500+ chats. How do I optimize it?"

**Agent**:
```
Let's optimize the unread messages query.

## Current Query Analysis
```sql
SELECT c.ID, c.UNREAD::INT
FROM "AA_CHAT" AS c
WHERE c.USER_ID = '1' AND c.UNREAD > 0;
```

**Problem**: No index on (user_id, unread), doing full table scan.

## Optimization Steps

### 1. Add Partial Index
```sql
CREATE INDEX idx_aa_chat_unread_user
ON public."AA_CHAT"(user_id, unread)
WHERE unread > 0;
```

**Why partial index?**
- Only indexes rows where unread > 0 (much smaller)
- Faster inserts (doesn't index unread = 0 rows)
- Perfect for this query pattern

### 2. Alternative: Materialized View (if needed)
```sql
CREATE MATERIALIZED VIEW mv_unread_chats AS
SELECT user_id, array_agg(json_build_object('id', id, 'unread', unread)) as chats
FROM "AA_CHAT"
WHERE unread > 0
GROUP BY user_id;

CREATE INDEX idx_mv_unread_user ON mv_unread_chats(user_id);

-- Refresh every minute
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_unread_chats;
```

### 3. Performance Impact
- Before: 3000ms (full scan of 500 rows)
- After (partial index): 5-10ms (index scan of ~20 rows)
- After (materialized view): 1-2ms (pre-aggregated)

### 4. Recommendation
Start with partial index. Only use materialized view if you have:
- 10,000+ chats per user
- Frequent unread checks
- Can tolerate 1-minute delay in updates
```

---

## Future Enhancements

This agent will be enhanced with:

1. **Live Database Access** (when credentials provided)
   - Execute queries directly
   - Run EXPLAIN ANALYZE
   - View table statistics

2. **n8n API Integration** (when API key provided)
   - Read workflow definitions
   - Suggest workflow modifications
   - Monitor execution logs

3. **Supabase Project Access** (after migration)
   - Manage RLS policies
   - Configure Auth settings
   - Monitor real-time subscriptions

---

## Quick Reference

### Invoke This Agent
```
"@backend-specialist, [your backend question or task]"
```

### Key Documentation Files
- Schema: `.claude/DATABASE_SCHEMA.md`
- API: `.claude/API_ENDPOINTS.md`
- Workflows: `.claude/N8N_WORKFLOWS.md`
- Architecture: `.claude/BACKEND_ARCHITECTURE.md`
- Migration: `.claude/SUPABASE_MIGRATION_PLAN.md`

### Common Patterns
```sql
-- Add column
ALTER TABLE "AA_TABLE" ADD COLUMN column_name TYPE;

-- Add index
CREATE INDEX idx_name ON "AA_TABLE"(columns);

-- Add foreign key
ALTER TABLE "AA_TABLE" ADD CONSTRAINT fk_name
  FOREIGN KEY (column) REFERENCES "OTHER_TABLE"(id);
```

---

**This agent is ready to help with all backend development tasks for the AVA Assistant project!**