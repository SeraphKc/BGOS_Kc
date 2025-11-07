# AVA Assistant - Backend Architecture

> **Last Updated**: November 4, 2025
> **Environment**: Production
> **Status**: Functional but missing authentication and cloud storage

---

## Tech Stack

### Core Technologies
- **Workflow Engine**: n8n (v1.x)
- **Database**: PostgreSQL 14+
- **AI Integration**: OpenAI GPT-4.1-mini
- **Frontend IPC**: Electron main/renderer process
- **Protocol**: HTTPS webhooks

### Deployment
- **n8n Instance**: https://n8n-test.brandgrowthos.ai
- **PostgreSQL**: Managed PostgreSQL (connection via n8n)
- **SSL/TLS**: Enabled
- **Authentication**: None (currently hardcoded in frontend)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Electron Application                         │
│  ┌──────────────┐        ┌─────────────┐                        │
│  │   Renderer   │◄──IPC─►│    Main     │                        │
│  │   Process    │        │   Process   │                        │
│  │  (React/UI)  │        │  (Node.js)  │                        │
│  └──────────────┘        └──────┬──────┘                        │
└───────────────────────────────── │─────────────────────────────┘
                                    │ HTTPS
                                    ▼
               ┌────────────────────────────────────┐
               │        n8n Workflows                │
               │  (Workflow Automation Platform)     │
               │                                     │
               │  ┌─────────────────────────┐       │
               │  │  Webhook Nodes (14)     │       │
               │  ├─────────────────────────┤       │
               │  │  PostgreSQL Nodes       │       │
               │  ├─────────────────────────┤       │
               │  │  Code Nodes (JS)        │       │
               │  ├─────────────────────────┤       │
               │  │  OpenAI Nodes           │       │
               │  ├─────────────────────────┤       │
               │  │  Schedule Triggers      │       │
               │  └─────────────────────────┘       │
               └─────────┬──────────────────────────┘
                         │
                  ┌──────┴───────┐
                  │              │
                  ▼              ▼
           ┌──────────┐   ┌──────────┐
           │PostgreSQL│   │ OpenAI   │
           │ Database │   │   API    │
           └──────────┘   └──────────┘
```

---

## Data Flow

### 1. User Interaction Flow
```
User Action (UI)
  → React Component (Frontend)
    → Service Layer (TypeScript)
      → Electron IPC (window.electronAPI)
        → Main Process (Node.js)
          → HTTP Request to n8n Webhook
            → n8n Workflow Execution
              → PostgreSQL Query
                → Response back through chain
```

### 2. Scheduled Task Flow
```
n8n Schedule Trigger (Hourly)
  → Select Pending Tasks (SQL)
    → For Each Task:
        → Update next_call
        → Route to Assistant Workflow
          → Execute AI Workflow
            → Insert Response to Chat
              → Increment Unread Counter
```

### 3. Message Sending Flow
```
User Types Message
  → ChatArea Component
    → useWebhook Hook
      → Electron IPC sendWebhookRequest
        → Main Process FormData Conversion
          → Assistant-Specific Webhook (e.g., Ava)
            → AI Processing
              → Response
                → Save to AA_CHAT_HISTORY
                  → Update Unread Counter
```

---

## Component Details

### Frontend Layer (Electron + React)

**Technology**:
- React 18 with TypeScript
- Redux Toolkit for state management
- Electron 36.5.0
- Tailwind CSS + Framer Motion

**Key Services**:
```
src/services/
├── DatabaseSyncService.ts       # RTK Query API for main operations
├── ChatCRUDService.ts           # Chat operations
├── AssistantCRUDService.ts      # Assistant operations
├── ChatHistoryCRUDService.ts    # Message operations
└── FetchUnreadMessagesService.ts # Unread counts
```

**IPC Bridge** (`src/preload.js`):
```javascript
window.electronAPI = {
  sendWebhookRequest: async (url, formDataObj) => {
    return await ipcRenderer.invoke('send-webhook-request', url, formDataObj);
  }
};
```

**Security**:
- Context Isolation: Enabled
- Node Integration: Disabled in renderer
- Web Security: Disabled (for CORS with n8n)

---

### Workflow Layer (n8n)

**Workflow ID**: `b6f845bc-2d9c-43b2-8412-c81871c8bf89`
**Base URL**: `https://n8n-test.brandgrowthos.ai/webhook/{workflow_id}`

**Node Types**:
1. **Webhook Nodes** (14): HTTP endpoints
2. **Postgres Nodes**: Database operations
3. **Code Nodes** (JavaScript): Data transformation
4. **OpenAI Nodes**: AI title generation
5. **Schedule Trigger**: Cron jobs
6. **Execute Workflow**: Call other workflows

**Credentials**:
- PostgreSQL: "Postgres account" (`deemRP1x5Z5wxU6M`)
- OpenAI: "n8n-test" (`Xp9BPHvoVunMr5gJ`)

---

### Database Layer (PostgreSQL)

**Schema**: `public`
**Tables**: 5 main tables
```
AA_USER              # User accounts (partially implemented)
AA_ASSISTANT         # AI assistant configurations
AA_CHAT              # Chat conversations
AA_CHAT_HISTORY      # Individual messages
AA_SCHEDULED_TASKS   # Periodic tasks
```

**Access Pattern**:
- All queries through n8n workflows
- No direct database connection from frontend
- SQL executed via n8n PostgreSQL nodes

**Data Format**:
- Database: snake_case
- Frontend: camelCase
- Transformation: Mapping functions in frontend

---

## Communication Patterns

### Request/Response Cycle

**Example**: Fetch Assistants with Chats
```javascript
// 1. Frontend Service
const response = await useAppSelector(state =>
  remoteDatabaseApi.endpoints.fetchAssistantsWithChats.select('1')(state)
);

// 2. RTK Query makes HTTP request
GET https://n8n-test.brandgrowthos.ai/webhook/.../assistants-with-chats/1

// 3. n8n Workflow
Webhook → Select Assistants → Select Chats → Merge → Respond

// 4. Response
{
  "assistants": [...],
  "chats": [...]
}

// 5. Frontend Redux Update
dispatch(setAssistants(response.assistants));
dispatch(setChats(response.chats));
```

---

## State Management

### Redux Store Structure
```javascript
{
  user: UserState,                    # Current user, token, auth status
  assistants: AssistantState,         # List, selected, loading
  chats: ChatState,                   # List, selected, loading
  chatHistory: ChatHistoryState,      # Messages, loading
  ui: UIState,                        # Modal states, etc.
  remoteDatabaseSyncApi: RTKState     # Query cache
}
```

### Data Synchronization
- **On Login**: Fetch all assistants and chats
- **On Chat Select**: Fetch chat history (last 20 messages)
- **On New Message**: Optimistic UI update + webhook call
- **Polling**: Unread messages fetched periodically

---

## File Storage Strategy

### Current Implementation (Base64)
```
User uploads image
  → Frontend converts to base64
    → Stores in AA_CHAT_HISTORY.files (JSONB)
      → Large database size, slow queries
```

**Issues**:
- Bloats database size
- Slow to query/retrieve
- No CDN for fast delivery
- No image optimization

### Recommended Migration (Cloud Storage)
```
User uploads file
  → Frontend sends to upload endpoint
    → n8n uploads to S3/Cloudinary
      → Returns URL
        → Store URL in database
          → Frontend loads from CDN
```

**Benefits**:
- Smaller database
- Faster queries
- CDN delivery
- Image optimization/resizing

---

## Authentication System

### Current State (Hardcoded)
```typescript
// src/components/LoginForm.tsx
const HARDCODED = {
  email: 'kc@gmail.com',
  password: '123'
};

if (email === HARDCODED.email && password === HARDCODED.password) {
  dispatch(login({
    user: { userId: '1', email: 'kc@gmail.com', name: 'Kc' },
    token: 'user-token-123'
  }));
}
```

**Issues**:
- No real authentication
- No session management
- No security
- Single hardcoded user

### Recommended Implementation (JWT)
```
User enters email/password
  → POST /auth/login
    → n8n validates credentials
      → bcrypt.compare(password, user.password_hash)
        → Generate JWT token
          → Return { user, accessToken, refreshToken }
            → Frontend stores in localStorage
              → Includes in Authorization header for all requests
```

**Required Backend Endpoints**:
- `POST /auth/login` - Login with credentials
- `POST /auth/logout` - Invalidate session
- `POST /auth/refresh` - Refresh access token
- `GET /users/me` - Get current user profile
- `PATCH /users/me` - Update user profile

---

## Real-time Communication

### Current Implementation (Polling)
```javascript
// Poll unread messages every 30 seconds
setInterval(() => {
  fetchUnreadMessages(userId);
}, 30000);
```

**Issues**:
- High server load
- Delayed updates (up to 30s)
- Waste bandwidth on no changes

### Recommended Implementation (WebSocket/SSE)
```javascript
// Server-Sent Events
const eventSource = new EventSource('/api/sse/updates');
eventSource.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data);
  if (type === 'new_message') {
    dispatch(addMessage(data));
  }
};
```

**Benefits**:
- Instant updates
- Lower server load
- Better user experience

---

## Scheduled Tasks System

### Architecture
```
PostgreSQL AA_SCHEDULED_TASKS
  ↓ (SELECT WHERE next_call < now())
n8n Schedule Trigger (hourly)
  ↓
Loop Over Pending Tasks
  ├→ Update next_call (+period hours)
  ├→ Route by assistant_code (Switch node)
  │   ├→ code='ava' → Execute Ava Workflow
  │   ├→ code='erica' → Execute Erica Workflow
  │   └→ code='sales' → Execute Sales Workflow
  │
  └→ Save Response to Chat
      └→ Increment Unread Counter
```

### Example Task
```json
{
  "id": 10,
  "user_id": 1,
  "chat_id": 123,
  "subject": "Daily weather update for London",
  "period": 24,
  "next_call": "2025-11-05T10:00:00Z",
  "assistant_code": "ava"
}
```

**Execution**:
1. Cron runs at 10:00
2. Task is selected
3. `next_call` updated to 2025-11-06T10:00:00Z
4. Ava workflow executed with subject
5. Response saved to chat_id 123
6. Unread counter incremented

---

## Error Handling

### Current State
- Limited error handling
- Most errors return 500 Internal Server Error
- No validation of inputs
- No user-friendly error messages

### Recommended Improvements
```javascript
// n8n IF Node for validation
if (!userId || isNaN(parseInt(userId))) {
  return [{
    json: {
      error: {
        message: "Invalid user ID",
        code: "INVALID_USER_ID"
      }
    },
    statusCode: 400
  }];
}
```

**Error Categories**:
- 400 Bad Request: Invalid input
- 401 Unauthorized: Authentication failure
- 403 Forbidden: Access denied
- 404 Not Found: Resource doesn't exist
- 500 Internal Server Error: Database/workflow error

---

## Performance Characteristics

### Current Performance
- **API Latency**: ~200-500ms (n8n overhead)
- **Database Queries**: Unoptimized (no indexes on FKs)
- **Chat History Load**: Last 20 messages (~50ms)
- **AI Title Generation**: 1-2 seconds
- **Scheduled Tasks**: Process all pending (no limit)

### Bottlenecks
1. No database indexes on foreign keys
2. Sequential SQL execution (DELETE operations)
3. Base64 file storage (large JSON blobs)
4. No query caching
5. No connection pooling visibility

### Optimization Opportunities
1. Add indexes on all foreign keys
2. Implement connection pooling
3. Migrate to cloud storage
4. Add Redis cache layer
5. Batch SQL operations in transactions

---

## Security Posture

### Current Vulnerabilities

| Vulnerability | Severity | Status |
|---------------|----------|--------|
| No Authentication | CRITICAL | Open |
| Public Webhooks | HIGH | Open |
| SQL Injection Risk | HIGH | Mitigated (limited) |
| No Input Validation | MEDIUM | Open |
| No Rate Limiting | MEDIUM | Open |
| CORS Disabled | LOW | By design |

### Mitigation Plan
1. **Immediate**: Implement API key validation
2. **Short-term**: Add JWT authentication
3. **Medium-term**: Implement rate limiting
4. **Long-term**: Migrate to Supabase (built-in RLS)

---

## Scalability Considerations

### Current Limits
- **Single n8n Instance**: No horizontal scaling
- **Single PostgreSQL**: No read replicas
- **No Caching**: Every request hits database
- **No CDN**: Files served from database

### Scaling Path
1. **Phase 1** (100 users): Current architecture sufficient
2. **Phase 2** (1,000 users): Add Redis cache, cloud storage
3. **Phase 3** (10,000 users): n8n clustering, PostgreSQL read replicas
4. **Phase 4** (100,000+ users): Migrate to Supabase or custom API layer

---

## Monitoring & Observability

### Current Monitoring
- n8n execution logs (Web UI only)
- No application performance monitoring
- No error tracking
- No usage analytics

### Recommended Tools
- **APM**: New Relic, DataDog, or Sentry
- **Logging**: ELK Stack or Splunk
- **Database**: pgAdmin, pg_stat_statements
- **Uptime**: UptimeRobot, Pingdom

---

## Deployment Architecture

### Current Setup
```
Docker Container
  ├── n8n (Node.js application)
  ├── PostgreSQL connection (external)
  └── OpenAI API client
```

### Recommended Production Setup
```
Load Balancer (Nginx)
  ├── n8n Instance 1 (Docker)
  ├── n8n Instance 2 (Docker)
  └── n8n Instance 3 (Docker)
      ↓
PostgreSQL (Managed)
  ├── Primary (Write)
  └── Replicas (Read)
      ↓
Redis Cache (Managed)
CloudFront CDN → S3 (File Storage)
```

---

## Cost Estimate (Monthly)

### Current Stack
- n8n Hosting: ~$29/month (self-hosted)
- PostgreSQL: ~$25/month (managed)
- OpenAI API: ~$10/month (low usage)
- **Total**: ~$64/month

### Recommended Production Stack
- n8n Cloud: ~$50/month (or self-host $100)
- PostgreSQL: ~$100/month (with replicas)
- Redis: ~$30/month
- S3 + CloudFront: ~$20/month
- OpenAI API: ~$50/month (higher usage)
- Monitoring: ~$50/month
- **Total**: ~$300-400/month

---

## Comparison: Current vs. Supabase

| Feature | Current (n8n) | Supabase |
|---------|---------------|----------|
| Database | PostgreSQL | PostgreSQL |
| Auth | Manual | Built-in |
| File Storage | Base64 in DB | S3-compatible |
| Real-time | Polling | WebSocket |
| API | Custom webhooks | Auto-generated REST |
| RLS | Manual | Built-in |
| Complexity | High | Low |
| Cost | ~$64/mo | ~$25/mo |
| Scalability | Manual | Automatic |

**Recommendation**: Migrate to Supabase for better DX, security, and cost-efficiency.

---

## Next Steps

1. **Immediate**: Document all workflows in Git
2. **Week 1**: Implement API key authentication
3. **Week 2**: Add database indexes
4. **Month 1**: Implement JWT authentication
5. **Month 2**: Migrate to cloud storage
6. **Month 3**: Plan Supabase migration
7. **Month 4-6**: Execute Supabase migration

---

**For detailed schema, see** `.claude/DATABASE_SCHEMA.md`
**For API endpoints, see** `.claude/API_ENDPOINTS.md`
**For n8n workflows, see** `.claude/N8N_WORKFLOWS.md`
**For Supabase migration, see** `.claude/SUPABASE_MIGRATION_PLAN.md`
