# AVA Assistant - Backend Documentation

> **For**: Development Team
> **Last Updated**: November 4, 2025
> **Status**: Comprehensive documentation of n8n + PostgreSQL backend

---

## Quick Links

This document provides a high-level overview of the backend architecture. For detailed technical documentation, see:

- **Database Schema**: `.claude/DATABASE_SCHEMA.md`
- **API Endpoints**: `.claude/API_ENDPOINTS.md`
- **n8n Workflows**: `.claude/N8N_WORKFLOWS.md`
- **Architecture Overview**: `.claude/BACKEND_ARCHITECTURE.md`
- **Supabase Migration Plan**: `.claude/SUPABASE_MIGRATION_PLAN.md`
- **Backend Specialist Agent**: `.claude/AGENT_BACKEND_SPECIALIST.md`

---

## Overview

AVA Assistant uses a modern stack combining n8n workflow automation with PostgreSQL for backend operations.

### Technology Stack
- **Workflow Engine**: n8n (https://n8n-test.brandgrowthos.ai)
- **Database**: PostgreSQL 14+
- **AI Integration**: OpenAI GPT-4.1-mini
- **Frontend**: Electron + React + Redux Toolkit
- **Communication**: HTTPS webhooks

---

## Database Schema

### Tables
1. **AA_USER** - User accounts and profiles
2. **AA_ASSISTANT** - AI assistant configurations
3. **AA_CHAT** - Chat conversations
4. **AA_CHAT_HISTORY** - Individual messages
5. **AA_SCHEDULED_TASKS** - Periodic assistant check-ins

### Key Relationships
```
USER → ASSISTANT → CHAT → CHAT_HISTORY
                    ├──→ SCHEDULED_TASKS
```

---

## API Endpoints

All operations exposed as webhook endpoints through n8n:

**Base URL**: `https://n8n-test.brandgrowthos.ai/webhook/b6f845bc-2d9c-43b2-8412-c81871c8bf89`

### Read Operations (3)
- `GET /assistants-with-chats/:userId` - Load assistants and chats
- `GET /chat-history/:userId/:chatId` - Load messages
- `GET /unread-messages/:userId` - Get unread counts

### Create Operations (5)
- `POST /assistants/:userId` - Create assistant
- `POST /:userId/chats` - Create chat with AI title
- `POST /chat-history/:userId` - Insert messages (bulk)
- `POST /assign-scheduled/:userId/:chatId` - Create scheduled task

### Update Operations (4)
- `PUT /assistants/:userId/:assistantId` - Update assistant
- `PATCH /chats/:userId/:chatId` - Rename chat
- `PATCH /unread-messages/:userId` - Increment unread

### Delete Operations (2)
- `DELETE /assistants/:userId/:assistantId` - Delete assistant (cascade)
- `DELETE /chats/:userId/:chatId` - Delete chat (cascade)

---

## Development Workflow

### Local Development
1. Frontend runs on `http://localhost:9000`
2. Backend accessed via n8n webhooks (remote)
3. No local n8n instance needed

### Making Backend Changes

**Workflow Modifications**:
1. Access n8n at https://n8n-test.brandgrowthos.ai
2. Deactivate current workflow
3. Make changes in visual editor
4. Test with webhook execution
5. Activate workflow
6. If errors: Restart Docker

**Database Changes**:
1. Write SQL migration script
2. Test on staging database
3. Execute on production via n8n SQL node
4. Update `.claude/DATABASE_SCHEMA.md`

---

## Common Tasks

### Add New API Endpoint

**Steps**:
1. Create webhook node in n8n
2. Add PostgreSQL/Code nodes for logic
3. Connect to response node
4. Test endpoint with Postman
5. Update frontend service layer
6. Document in `.claude/API_ENDPOINTS.md`

**Example** (Add starring endpoint):
```
Webhook (POST /assistants/:userId/:assistantId/star)
  └─> Execute Query (Toggle is_starred)
        └─> Respond to Webhook
```

### Debug Slow Query

**Steps**:
1. Check n8n execution logs
2. Copy SQL query
3. Run EXPLAIN ANALYZE in pgAdmin
4. Add indexes if needed
5. Document optimization in schema docs

### Add Database Column

**Steps**:
1. Write ALTER TABLE script
2. Test in staging
3. Execute via n8n SQL node
4. Update TypeScript types
5. Update mapping functions
6. Update schema documentation

---

## Troubleshooting

### Webhook Returns 404
- **Cause**: Workflow not activated or wrong URL
- **Fix**: Check workflow activation status in n8n

### Slow API Response (>1s)
- **Cause**: Missing database indexes
- **Fix**: Add indexes on foreign keys and WHERE clause columns

### "Webhook path already in use"
- **Cause**: Duplicate webhook paths
- **Fix**: Deactivate old workflow, restart Docker if needed

### Data Not Syncing
- **Cause**: Frontend mapping issue (snake_case vs camelCase)
- **Fix**: Check mapping functions in `src/types/AssistantWebhookMap.ts`

---

## Security

### Current State
- ⚠️ **No authentication** (hardcoded credentials)
- ⚠️ **Public webhooks** (UUID-based obscurity only)
- ⚠️ **Limited validation** (minimal input checking)

### Planned Improvements
1. **Phase 1**: Add API key validation
2. **Phase 2**: Implement JWT authentication
3. **Phase 3**: Add rate limiting
4. **Phase 4**: Migrate to Supabase (built-in RLS)

---

## Performance

### Current Metrics
- **API Latency**: 200-500ms (n8n overhead)
- **Database Queries**: Unoptimized (no indexes on FKs)
- **Chat History Load**: Last 20 messages (~50ms)
- **AI Title Generation**: 1-2 seconds

### Optimization Priorities
1. Add database indexes on all foreign keys
2. Migrate from base64 file storage to cloud storage
3. Implement query caching
4. Optimize n8n workflows (batch operations)

---

## Future Roadmap

### Short-term (1-3 months)
- [ ] Implement JWT authentication
- [ ] Migrate to cloud storage (S3/Cloudinary)
- [ ] Add starring feature endpoints
- [ ] Implement rate limiting

### Medium-term (3-6 months)
- [ ] Plan Supabase migration
- [ ] Add real-time WebSocket updates
- [ ] Implement comprehensive logging
- [ ] Add performance monitoring

### Long-term (6-12 months)
- [ ] Complete Supabase migration
- [ ] Implement advanced analytics
- [ ] Add multi-user collaboration
- [ ] Scale to 10,000+ users

---

## Team Resources

### Access
- **n8n Dashboard**: https://n8n-test.brandgrowthos.ai (ask for credentials)
- **PostgreSQL**: Via n8n only (no direct access)
- **Documentation**: `.claude/` folder in project root

### Support
- **Backend Issues**: Consult "BG OS Back-end developer" specialist agent
- **Frontend Integration**: See `src/services/` for service layer
- **Schema Questions**: See `.claude/DATABASE_SCHEMA.md`

---

## Deployment

### Current Setup
- **Hosting**: Docker container
- **Database**: Managed PostgreSQL (connection via n8n)
- **SSL/TLS**: Enabled
- **Backups**: Daily PostgreSQL backups

### Deployment Process
1. Make changes in n8n UI
2. Test thoroughly
3. Activate workflow
4. Monitor execution logs
5. Rollback if errors (deactivate workflow)

---

## Cost Breakdown (Monthly)

- n8n Hosting: ~$29/month
- PostgreSQL: ~$25/month
- OpenAI API: ~$10/month
- **Total**: ~$64/month

**Projected with Supabase**: ~$35/month (45% savings)

---

## Getting Help

### For Backend Questions
Use the "BG OS Back-end developer" specialist agent in Claude Code:
```
@backend-specialist, I need help with [backend task]
```

### For Urgent Issues
1. Check n8n execution logs
2. Review recent workflow changes
3. Check database connection status
4. Contact team lead

---

**This documentation is maintained by the development team. Last reviewed: November 4, 2025.**
