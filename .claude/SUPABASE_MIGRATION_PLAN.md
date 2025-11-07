# AVA Assistant - Supabase Migration Plan

> **Status**: Planning phase
> **Priority**: Medium (after authentication and cloud storage)
> **Estimated Effort**: 8-12 weeks
> **Risk Level**: Medium

---

## Executive Summary

This document outlines the complete migration strategy from the current **n8n + PostgreSQL** backend to **Supabase**, a modern Backend-as-a-Service platform built on PostgreSQL.

### Why Migrate?

| Current (n8n) | Supabase | Improvement |
|---------------|----------|-------------|
| Manual authentication | Built-in Auth | Faster development |
| Base64 file storage | S3-compatible Storage | Better performance |
| Polling for updates | Real-time WebSocket | Instant updates |
| Custom webhook APIs | Auto-generated REST API | Less maintenance |
| Manual security | Row Level Security (RLS) | Better security |
| ~$64/month | ~$25/month | 61% cost reduction |
| Complex setup | Simple dashboard | Better DX |

### Migration Timeline

```
Month 1-2: Preparation & Setup
Month 3-4: Database & Auth Migration
Month 5-6: Storage & Real-time Migration
Month 7-8: Testing & Cutover
```

---

## Current Architecture Pain Points

### 1. n8n Limitations
- **Latency**: Every request goes through n8n workflow (200-500ms overhead)
- **Complexity**: 14 separate webhook workflows to maintain
- **Scaling**: Single instance, no automatic scaling
- **Dev Experience**: Visual workflow editor, not code-first
- **Debugging**: Limited error tracking and logging

### 2. Authentication Gaps
- **No real auth**: Currently hardcoded credentials
- **No sessions**: No token management
- **No security**: Public webhooks with obscure UUIDs only

### 3. File Storage Issues
- **Base64 in database**: Bloats database size
- **Slow queries**: Large JSON blobs
- **No CDN**: Files served directly from database
- **No optimization**: No image resizing/compression

### 4. Real-time Gaps
- **Polling only**: 30-second delays for updates
- **High load**: Frequent unnecessary requests
- **Poor UX**: Delayed message delivery

---

## Supabase Advantages

### Built-in Features
1. **Authentication**: Email, OAuth, Magic Links, MFA
2. **Database**: PostgreSQL with auto-generated REST API
3. **Storage**: S3-compatible object storage with CDN
4. **Real-time**: WebSocket subscriptions for live updates
5. **Row Level Security (RLS)**: Database-level access control
6. **Edge Functions**: Serverless compute (Deno runtime)

### Developer Experience
- **Auto-generated API**: No manual endpoint creation
- **Type Safety**: Auto-generated TypeScript types
- **Dashboard**: Web UI for database management
- **CLI**: Database migrations, local development
- **Documentation**: Auto-generated API docs

### Cost Efficiency
```
Current (n8n + PostgreSQL):
- n8n: $29/month
- PostgreSQL: $25/month
- OpenAI: $10/month
Total: $64/month

Supabase:
- Pro Plan: $25/month (includes everything)
- OpenAI: $10/month
Total: $35/month

Savings: $29/month (45%)
```

---

## Migration Strategy

### Phase 0: Prerequisites (2 weeks)

**Before starting migration**:
1. ✅ Complete backend documentation (DONE)
2. ⏳ Implement JWT authentication in current system
3. ⏳ Migrate to cloud storage (S3/Cloudinary)
4. ⏳ Add comprehensive tests for all API endpoints
5. ⏳ Create staging environment

**Deliverables**:
- Authenticated API
- Cloud storage integration
- Test suite (>80% coverage)
- Staging environment

---

### Phase 1: Setup & Database Migration (3-4 weeks)

#### Week 1: Supabase Project Setup

**Tasks**:
1. Create Supabase project
2. Configure project settings
3. Set up local development with Supabase CLI
4. Configure environment variables
5. Set up staging project

**Commands**:
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize project
supabase init

# Start local development
supabase start

# Link to remote project
supabase link --project-ref your-project-ref
```

#### Week 2-3: Schema Migration

**1. Export Current Schema**:
```bash
# From n8n PostgreSQL
pg_dump -h your-host -U your-user -d your-db --schema-only > schema.sql
```

**2. Clean and Adapt Schema**:
```sql
-- Remove n8n-specific elements
-- Add Supabase-specific features
-- Update naming conventions if needed

-- Example: AA_USER table for Supabase
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own data"
ON public.users FOR SELECT
USING (auth.uid() = id);
```

**3. Create Migration Files**:
```bash
# Generate migration
supabase migration new initial_schema

# Apply migration
supabase db push
```

**Migration Script** (`.supabase/migrations/001_initial_schema.sql`):
```sql
-- Users table (integrates with Supabase Auth)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(100),
  theme VARCHAR(10) DEFAULT 'dark',
  language VARCHAR(10) DEFAULT 'en',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assistants table
CREATE TABLE public.assistants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users NOT NULL,
  name VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  avatar_url TEXT,
  webhook_url VARCHAR(500) NOT NULL,
  s2s_token VARCHAR(255),
  code VARCHAR(50) NOT NULL,
  is_starred BOOLEAN DEFAULT FALSE,
  star_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chats table
CREATE TABLE public.chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assistant_id UUID REFERENCES public.assistants ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users ON DELETE CASCADE NOT NULL,
  title VARCHAR(500),
  unread INTEGER DEFAULT 0,
  is_starred BOOLEAN DEFAULT FALSE,
  star_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat history table
CREATE TABLE public.chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES public.chats ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users ON DELETE CASCADE NOT NULL,
  sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'assistant')),
  sent_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  text TEXT,

  -- Attachments (migrated from base64 to URLs)
  has_attachment BOOLEAN DEFAULT FALSE,
  files JSONB, -- Array of {url, type, name}

  -- Artifacts
  artifact_code TEXT,
  is_code BOOLEAN DEFAULT FALSE,
  is_article BOOLEAN DEFAULT FALSE,
  article_text TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled tasks table
CREATE TABLE public.scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users ON DELETE CASCADE NOT NULL,
  chat_id UUID REFERENCES public.chats ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  period INTEGER NOT NULL, -- hours
  next_call TIMESTAMPTZ NOT NULL,
  assistant_code VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_assistants_user_id ON public.assistants(user_id);
CREATE INDEX idx_assistants_starred ON public.assistants(user_id, is_starred, star_order);
CREATE INDEX idx_chats_user_id ON public.chats(user_id);
CREATE INDEX idx_chats_assistant_id ON public.chats(assistant_id);
CREATE INDEX idx_chats_starred ON public.chats(user_id, is_starred, star_order);
CREATE INDEX idx_chats_unread ON public.chats(user_id, unread) WHERE unread > 0;
CREATE INDEX idx_chat_history_chat_id ON public.chat_history(chat_id, sent_date DESC);
CREATE INDEX idx_scheduled_tasks_next_call ON public.scheduled_tasks(next_call) WHERE next_call < NOW();

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_history;
```

#### Week 4: Data Migration

**1. Export Data**:
```sql
-- Export users
COPY (SELECT * FROM "AA_USER") TO '/tmp/users.csv' WITH CSV HEADER;

-- Export assistants
COPY (SELECT * FROM "AA_ASSISTANT") TO '/tmp/assistants.csv' WITH CSV HEADER;

-- Export chats
COPY (SELECT * FROM "AA_CHAT") TO '/tmp/chats.csv' WITH CSV HEADER;

-- Export chat history
COPY (SELECT * FROM "AA_CHAT_HISTORY") TO '/tmp/chat_history.csv' WITH CSV HEADER;

-- Export scheduled tasks
COPY (SELECT * FROM "AA_SCHEDULED_TASKS") TO '/tmp/scheduled_tasks.csv' WITH CSV HEADER;
```

**2. Transform Data** (Python script):
```python
import pandas as pd
import uuid

# Read old data
users = pd.read_csv('/tmp/users.csv')
assistants = pd.read_csv('/tmp/assistants.csv')

# Transform: Integer IDs → UUIDs
user_id_map = {old_id: str(uuid.uuid4()) for old_id in users['id']}
assistant_id_map = {old_id: str(uuid.uuid4()) for old_id in assistants['id']}

# Update foreign keys
assistants['user_id'] = assistants['user_id'].map(user_id_map)
assistants['id'] = assistants['id'].map(assistant_id_map)

# Save transformed data
assistants.to_csv('/tmp/assistants_transformed.csv', index=False)
```

**3. Import to Supabase**:
```bash
# Using Supabase CLI
supabase db import users.csv --table users
supabase db import assistants.csv --table assistants
supabase db import chats.csv --table chats
supabase db import chat_history.csv --table chat_history
supabase db import scheduled_tasks.csv --table scheduled_tasks
```

---

### Phase 2: Authentication Migration (2-3 weeks)

#### Week 1: Supabase Auth Setup

**1. Configure Auth Providers**:
```typescript
// supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
```

**2. Create Auth Functions**:
```typescript
// src/services/AuthService.ts
import { supabase } from './supabase';

export const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;

  // Create user profile if doesn't exist
  const { error: profileError } = await supabase
    .from('users')
    .upsert({
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata.name || email.split('@')[0]
    });

  return data;
};

export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};
```

#### Week 2: Replace Frontend Auth

**1. Update Login Form**:
```typescript
// src/components/LoginForm.tsx
import { login } from '../services/AuthService';

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const data = await login(email, password);
    // Supabase handles session automatically
    dispatch(setUser(data.user));
    navigate('/');
  } catch (error) {
    setError(error.message);
  }
};
```

**2. Add Auth State Listener**:
```typescript
// src/App.tsx
useEffect(() => {
  // Listen for auth state changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (session?.user) {
        dispatch(setUser(session.user));
      } else {
        dispatch(logout());
      }
    }
  );

  return () => subscription.unsubscribe();
}, []);
```

#### Week 3: Row Level Security Policies

**Create RLS policies for all tables**:
```sql
-- ASSISTANTS: Users can only access their own assistants
CREATE POLICY "Users can view own assistants"
ON public.assistants FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assistants"
ON public.assistants FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assistants"
ON public.assistants FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assistants"
ON public.assistants FOR DELETE
USING (auth.uid() = user_id);

-- CHATS: Users can only access their own chats
CREATE POLICY "Users can view own chats"
ON public.chats FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chats"
ON public.chats FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chats"
ON public.chats FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chats"
ON public.chats FOR DELETE
USING (auth.uid() = user_id);

-- CHAT_HISTORY: Users can only access their own messages
CREATE POLICY "Users can view own messages"
ON public.chat_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
ON public.chat_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- SCHEDULED_TASKS: Users can only access their own tasks
CREATE POLICY "Users can view own tasks"
ON public.scheduled_tasks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own tasks"
ON public.scheduled_tasks FOR ALL
USING (auth.uid() = user_id);
```

---

### Phase 3: API Migration (3-4 weeks)

#### Replace n8n Webhooks with Supabase Client

**Before (n8n)**:
```typescript
// Fetch assistants via webhook
const response = await fetch(
  'https://n8n-test.brandgrowthos.ai/webhook/.../assistants-with-chats/1'
);
const data = await response.json();
```

**After (Supabase)**:
```typescript
// Fetch assistants via Supabase client
const { data, error } = await supabase
  .from('assistants')
  .select('*')
  .eq('user_id', userId);
```

#### Update All Services

**1. Assistant Operations**:
```typescript
// src/services/AssistantService.ts
export const fetchAssistants = async () => {
  const { data, error } = await supabase
    .from('assistants')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createAssistant = async (assistant: NewAssistant) => {
  const { data, error } = await supabase
    .from('assistants')
    .insert([assistant])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateAssistant = async (id: string, updates: Partial<Assistant>) => {
  const { data, error } = await supabase
    .from('assistants')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteAssistant = async (id: string) => {
  const { error } = await supabase
    .from('assistants')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
```

**2. Chat Operations**:
```typescript
// src/services/ChatService.ts
export const fetchChats = async (assistantId: string) => {
  const { data, error} = await supabase
    .from('chats')
    .select('*')
    .eq('assistant_id', assistantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createChat = async (assistantId: string, firstMessage: string) => {
  // Use OpenAI to generate title
  const title = await generateChatTitle(firstMessage);

  const { data, error } = await supabase
    .from('chats')
    .insert([{
      assistant_id: assistantId,
      title
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};
```

**3. Message Operations**:
```typescript
// src/services/MessageService.ts
export const fetchMessages = async (chatId: string, limit = 20) => {
  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('chat_id', chatId)
    .order('sent_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data.reverse(); // Return in ascending order
};

export const sendMessage = async (chatId: string, text: string) => {
  const { data, error } = await supabase
    .from('chat_history')
    .insert([{
      chat_id: chatId,
      sender: 'user',
      text,
      sent_date: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;

  // Reset unread counter
  await supabase
    .from('chats')
    .update({ unread: 0 })
    .eq('id', chatId);

  return data;
};
```

---

### Phase 4: Storage Migration (2-3 weeks)

#### Week 1: Supabase Storage Setup

**1. Create Storage Buckets**:
```typescript
// Create buckets via Supabase dashboard or CLI
supabase storage create bucket avatars --public
supabase storage create bucket chat-attachments --public

// Or programmatically:
const { data, error } = await supabase.storage.createBucket('avatars', {
  public: true,
  fileSizeLimit: 5242880 // 5MB
});
```

**2. Configure Storage Policies**:
```sql
-- Allow users to upload their own avatars
CREATE POLICY "Users can upload own avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public access to avatars
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow users to delete own avatars
CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Week 2-3: Migrate Base64 Files to URLs

**1. Migration Script**:
```typescript
// scripts/migrate-files-to-storage.ts
import { supabase } from '../src/services/supabase';

async function migrateAvatars() {
  // Fetch all assistants with base64 avatars
  const { data: assistants } = await supabase
    .from('assistants')
    .select('id, avatar_url')
    .like('avatar_url', 'data:image%');

  for (const assistant of assistants) {
    // Extract base64 data
    const base64Data = assistant.avatar_url.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    // Upload to Supabase Storage
    const filePath = `${assistant.id}/avatar.png`;
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) {
      console.error(`Failed to upload avatar for ${assistant.id}:`, error);
      continue;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Update database with URL
    await supabase
      .from('assistants')
      .update({ avatar_url: publicUrl })
      .eq('id', assistant.id);

    console.log(`Migrated avatar for assistant ${assistant.id}`);
  }
}

async function migrateChatAttachments() {
  // Similar process for chat attachments
  const { data: messages } = await supabase
    .from('chat_history')
    .select('id, files')
    .not('files', 'is', null);

  for (const message of messages) {
    const files = JSON.parse(message.files);
    const uploadedFiles = [];

    for (const file of files) {
      if (file.fileData.startsWith('data:')) {
        const base64Data = file.fileData.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');

        const filePath = `${message.id}/${file.fileName}`;
        const { error } = await supabase.storage
          .from('chat-attachments')
          .upload(filePath, buffer, {
            contentType: file.fileMimeType,
            upsert: true
          });

        if (!error) {
          const { data: { publicUrl } } = supabase.storage
            .from('chat-attachments')
            .getPublicUrl(filePath);

          uploadedFiles.push({
            url: publicUrl,
            name: file.fileName,
            type: file.fileMimeType
          });
        }
      }
    }

    // Update message with new file URLs
    await supabase
      .from('chat_history')
      .update({ files: JSON.stringify(uploadedFiles) })
      .eq('id', message.id);

    console.log(`Migrated attachments for message ${message.id}`);
  }
}

// Run migrations
migrateAvatars();
migrateChatAttachments();
```

**2. Update Upload Logic**:
```typescript
// src/services/StorageService.ts
export const uploadAvatar = async (file: File, userId: string) => {
  const filePath = `${userId}/avatar.${file.name.split('.').pop()}`;

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return publicUrl;
};

export const uploadChatAttachment = async (file: File, chatId: string) => {
  const filePath = `${chatId}/${Date.now()}_${file.name}`;

  const { data, error } = await supabase.storage
    .from('chat-attachments')
    .upload(filePath, file);

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('chat-attachments')
    .getPublicUrl(filePath);

  return publicUrl;
};
```

---

### Phase 5: Real-time Migration (1-2 weeks)

#### Replace Polling with Subscriptions

**Before (Polling)**:
```typescript
// Poll for new messages every 30 seconds
useEffect(() => {
  const interval = setInterval(() => {
    fetchUnreadMessages();
  }, 30000);

  return () => clearInterval(interval);
}, []);
```

**After (Real-time)**:
```typescript
// src/hooks/useRealtimeMessages.ts
import { useEffect } from 'react';
import { supabase } from '../services/supabase';

export const useRealtimeMessages = (chatId: string) => {
  useEffect(() => {
    // Subscribe to new messages
    const subscription = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_history',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          dispatch(addMessage(payload.new));
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [chatId]);
};
```

**Real-time Unread Counter**:
```typescript
export const useRealtimeUnread = (userId: string) => {
  useEffect(() => {
    const subscription = supabase
      .channel('unread-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chats',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          dispatch(updateChatUnread({
            chatId: payload.new.id,
            unread: payload.new.unread
          }));
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);
};
```

---

### Phase 6: Scheduled Tasks Migration (1-2 weeks)

**Option 1: Supabase Edge Functions**:
```typescript
// supabase/functions/scheduled-tasks/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Select pending tasks
  const { data: tasks } = await supabase
    .from('scheduled_tasks')
    .select('*')
    .lt('next_call', new Date().toISOString());

  for (const task of tasks) {
    // Execute task (call AI assistant)
    const response = await executeAssistantTask(task);

    // Save response to chat
    await supabase.from('chat_history').insert({
      chat_id: task.chat_id,
      user_id: task.user_id,
      sender: 'assistant',
      text: response
    });

    // Update unread counter
    await supabase
      .from('chats')
      .update({ unread: supabase.rpc('increment', { x: 1 }) })
      .eq('id', task.chat_id);

    // Update next_call
    const nextCall = new Date();
    nextCall.setHours(nextCall.getHours() + task.period);
    await supabase
      .from('scheduled_tasks')
      .update({ next_call: nextCall.toISOString() })
      .eq('id', task.id);
  }

  return new Response('OK', { status: 200 });
});
```

**Configure Cron** (via Supabase dashboard):
```
0 * * * * - Run every hour
Endpoint: https://your-project.supabase.co/functions/v1/scheduled-tasks
```

**Option 2: Keep n8n for Scheduled Tasks**:
- Continue using n8n Schedule Trigger
- Update workflows to call Supabase instead of direct PostgreSQL
- Simpler migration, leverages existing n8n workflows

---

### Phase 7: Testing & Validation (2 weeks)

#### Parallel Run Strategy

**Week 1: Dual Write**:
```typescript
// Write to both systems
const saveMessage = async (message) => {
  // Write to Supabase (primary)
  await supabase.from('chat_history').insert(message);

  // Write to n8n/PostgreSQL (backup)
  await legacyAPI.saveMessage(message);
};

// Read from Supabase only
const getMessages = async (chatId) => {
  return await supabase
    .from('chat_history')
    .select('*')
    .eq('chat_id', chatId);
};
```

**Week 2: Validation & Cutover**:
1. Compare data between both systems
2. Validate real-time subscriptions work
3. Test all user workflows end-to-end
4. Load testing (simulate 100+ concurrent users)
5. Security audit (RLS policies)
6. Performance benchmarking

#### Cutover Checklist

- [ ] All data migrated and validated
- [ ] Authentication working (test with 10+ users)
- [ ] File storage migrated (all URLs working)
- [ ] Real-time subscriptions active
- [ ] Scheduled tasks running on new system
- [ ] Performance metrics meet targets (<100ms API latency)
- [ ] Security audit passed (RLS policies correct)
- [ ] Rollback plan documented
- [ ] Team trained on Supabase dashboard
- [ ] Monitoring configured (Supabase observability)

---

## Rollback Plan

### If Migration Fails

**Quick Rollback** (< 1 hour):
1. Revert frontend to use n8n webhook endpoints
2. Disable Supabase Auth (use hardcoded again)
3. Stop real-time subscriptions
4. Re-enable n8n workflows

**Data Recovery**:
- Keep n8n PostgreSQL running during parallel phase
- Daily backups of both databases
- Can restore from n8n backup if needed

---

## Post-Migration Optimization

### Week 1-2: Performance Tuning
- Monitor query performance via Supabase dashboard
- Add additional indexes as needed
- Optimize RLS policies
- Configure connection pooling

### Week 3-4: Cost Optimization
- Review storage usage (clean up unused files)
- Optimize database queries (reduce API calls)
- Configure CDN caching for static assets
- Review and adjust pricing plan

### Month 2: Feature Enhancements
- Implement features that were hard with n8n:
  - Multi-user real-time collaboration
  - Advanced search with full-text search
  - Analytics dashboard
  - Webhook integrations (Zapier, Make)

---

## Success Metrics

### Performance
- API latency: < 100ms (vs 200-500ms with n8n)
- Real-time delivery: < 500ms (vs 30s polling)
- File upload speed: < 2s for 5MB file

### Cost
- Monthly cost: < $50/month (vs $64/month)
- Cost per user: < $0.50/month

### Developer Experience
- Time to add new endpoint: < 5 min (vs 30 min with n8n)
- Local development setup: < 10 min
- Deployment time: < 5 min

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Data loss during migration | HIGH | LOW | Dual-write phase, backups |
| Performance regression | MEDIUM | MEDIUM | Load testing, benchmarking |
| RLS policy bugs | HIGH | MEDIUM | Security audit, testing |
| User experience issues | MEDIUM | LOW | Parallel run, gradual rollout |
| Cost overrun | LOW | LOW | Monitor usage, set alerts |
| Team learning curve | MEDIUM | HIGH | Training, documentation |

---

## Conclusion

Migrating to Supabase offers significant benefits:
- **Better DX**: Auto-generated APIs, TypeScript types
- **Lower cost**: 45% cost reduction
- **Better performance**: Real-time updates, faster API
- **Better security**: Built-in RLS, Auth
- **Better scalability**: Automatic scaling

**Recommendation**: Proceed with migration after completing Phase 0 prerequisites.

---

**Next Steps**:
1. Review this plan with team
2. Complete Phase 0 prerequisites
3. Set up Supabase staging project
4. Begin Phase 1 (database migration)

---

**For current architecture, see** `.claude/BACKEND_ARCHITECTURE.md`
**For database schema, see** `.claude/DATABASE_SCHEMA.md`
**For API endpoints, see** `.claude/API_ENDPOINTS.md`
