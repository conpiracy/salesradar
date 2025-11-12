# zeronsh-chat + Convex Migration Guide

## Overview

Successfully migrated the zeronsh-chat application from **Drizzle ORM + Zero (Rocicorp)** to **Convex** as the backend database and real-time sync layer, while preserving the entire frontend codebase.

**Branch:** `claude/zeronsh-frontend-convex-backend-011CV39EHHGCLwLKggy8qZpi`

---

## What Was Completed ✅

### 1. Backend Migration

#### Convex Schema Created
Converted all Drizzle PostgreSQL tables to Convex schema (`convex/schema.ts`):

| Table | Purpose | Key Indexes |
|-------|---------|-------------|
| **users** | User accounts (Better Auth) | by_email |
| **sessions** | Active sessions | by_sessionToken, by_userId |
| **accounts** | OAuth accounts | by_userId, by_accountId |
| **verifications** | Email verification | by_identifier |
| **threads** | Chat conversations | by_userId, by_streamId, by_userId_updatedAt |
| **messages** | Chat messages | by_threadId, by_userId, by_threadId_createdAt |
| **models** | AI models (25+) | by_modelId, by_access |
| **settings** | User preferences | by_userId |
| **usage** | Credit tracking | by_userId |
| **userCustomers** | Stripe subscriptions (users) | by_userId, by_customerId |
| **organizations** | Teams/orgs | by_slug |
| **members** | Org membership | by_organizationId, by_userId, by_org_user |
| **invitations** | Org invites | by_organizationId, by_email |
| **organizationCustomers** | Stripe subscriptions (orgs) | by_organizationId, by_customerId |

#### Convex Functions Implemented

**`convex/threads.ts`**
- `list()` - Query user's threads ordered by updatedAt
- `get(id)` - Get single thread with auth check
- `create(title?)` - Create new thread (auto-creates user if needed)
- `update(id, title?, status?, streamId?)` - Update thread
- `remove(id)` - Delete thread with cascade (deletes all messages)

**`convex/messages.ts`**
- `list(threadId)` - Get all messages in thread
- `create(threadId, message)` - Add message to thread
- `update(id, message)` - Update message content

**`convex/models.ts`**
- `list()` - Get models based on user access level (public/account/premium)
- `get(modelId)` - Get single model
- `seed()` - Populate initial models (gpt-4o, claude-4, gemini-2.5, etc.)

**`convex/settings.ts`**
- `get()` - Get user settings
- `getOrCreate()` - Initialize settings with defaults
- `update(...)` - Update settings (theme, default model, pinned models, etc.)

**`convex/usage.ts`**
- `get()` - Get user's credit usage
- `deductCredits(amount)` - Subtract credits
- `addCredits(amount)` - Add credits (purchases/refills)
- `deductSearch()` - Decrement search count
- `deductResearch()` - Decrement research count

#### Dependencies Updated

**Removed:**
```json
"drizzle-orm": "^0.44.6",
"drizzle-kit": "^0.31.5",
"drizzle-zero": "^0.13.3",
"@rocicorp/zero": "^0.23.2025090100",
"pg": "^8.16.3",
"ioredis": "^5.7.0",
"redis": "^5.8.2",
"effect-redis": "^0.0.11"
```

**Added:**
```json
"convex": "^1.17.2",
"concurrently": "^9.1.0"
```

#### Scripts Updated

**Before:**
```json
"dev": "dotenvx run -- vite",
"build": "pnpm run database:migrate:prod && pnpm run zero:deploy && ...",
"database:push": "dotenvx run -- npx drizzle-kit push",
"database:migrate": "dotenvx run -- npx drizzle-kit migrate",
"zero:deploy": "dotenvx run -f .env.production -- npx zero-deploy-permissions ..."
```

**After:**
```json
"dev": "dotenvx run -- concurrently \"vite\" \"convex dev\"",
"build": "dotenvx run -f .env.production -- vite build",
"convex:dev": "convex dev",
"convex:deploy": "convex deploy"
```

#### Files Removed
- `drizzle/` (19 migration files + metadata)
- `docker-compose.yml` (PostgreSQL + Redis)
- `drizzle.config.ts`
- `drizzle-zero.config.ts`
- `src/zero/` directory

---

## What Remains To Be Done 🚧

### 2. Frontend Integration (Critical)

The frontend code still references Drizzle/Zero. These files need to be updated:

#### High Priority

**A. Root Setup (`src/routes/__root.tsx`)**
```typescript
// CURRENT (Drizzle + Zero):
import { DatabaseProvider } from '@/context/database';
import { ZeroProvider } from '@/zero';

// NEEDS TO BE:
import { ConvexProvider } from 'convex/react';
import { ConvexReactClient } from 'convex/react';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

// Replace <DatabaseProvider> with <ConvexProvider>
```

**B. Database Context (`src/context/database.tsx`)**
```typescript
// THIS FILE SHOULD BE DELETED OR REPLACED
// Current: Provides Zero database instance
// Needed: Convex doesn't need a context provider (uses ConvexProvider from __root)
```

**C. Database Hook (`src/hooks/use-database.ts`)**
```typescript
// CURRENT:
export function useDatabase() {
  return useContext(DatabaseContext); // Returns Zero instance
}

// NEEDS TO BE:
// Delete this file - use Convex hooks directly:
// - useQuery(api.threads.list)
// - useMutation(api.threads.create)
```

**D. Thread Components**

Files that need updating:
- `src/components/layout/app-sidebar.tsx` - Uses `useDatabase()` to query threads
- `src/components/thread/thread-container.tsx` - Manages thread state
- `src/components/thread/message/message-list.tsx` - Displays messages
- `src/components/thread/multi-modal-input.tsx` - Creates messages

Example conversion:
```typescript
// BEFORE (Zero):
const db = useDatabase();
const threads = useQuery(db.thread.orderBy('updatedAt', 'desc'));

// AFTER (Convex):
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';

const threads = useQuery(api.threads.list);
```

**E. Settings/Account Pages**

Files that need updating:
- `src/routes/_account.account.preferences.tsx`
- `src/routes/_account.account.models.tsx`
- `src/routes/_account.account.appearance.tsx`

Example:
```typescript
// BEFORE:
const settings = db.setting.findFirst({ where: { userId } });

// AFTER:
const settings = useQuery(api.settings.get);
```

**F. API Routes**

These routes interact with the database and need Convex integration:

`src/routes/api.thread.ts` - Create thread
```typescript
// BEFORE:
await db.insert(thread).values({ ... });

// AFTER:
import { ConvexHttpClient } from 'convex/browser';
const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL);
await convex.mutation(api.threads.create, { ... });
```

`src/routes/api.thread.$threadId.stream.ts` - Streaming endpoint
```typescript
// BEFORE:
const thread = await db.thread.findFirst({ ... });
const messages = await db.message.findMany({ ... });

// AFTER:
const thread = await convex.query(api.threads.get, { id: threadId });
const messages = await convex.query(api.messages.list, { threadId });
```

`src/routes/api.thread.$threadId.stop.ts` - Stop streaming
```typescript
// Update thread status using Convex mutation
await convex.mutation(api.threads.update, {
  id: threadId,
  status: 'ready',
  streamId: undefined,
});
```

#### Medium Priority

**G. Database Schema Files**
These can be deleted or kept for reference:
- `src/database/app-schema.ts`
- `src/database/auth-schema.ts`
- `src/database/schema.ts`
- `src/database/queries.ts`
- `src/database/effect.ts`
- `src/database/index.ts`

**H. Thread State Management**
- `src/thread/state.ts` - May need updates if it references database
- `src/thread/store.ts` - Zustand store for thread UI state (probably fine)

**I. Hooks**
- `src/hooks/use-chats-by-time-range.ts` - Queries threads by date range
- `src/hooks/use-auto-resume.ts` - Auto-resume interrupted streams

#### Low Priority

**J. Environment Variables**

Update `.env.example` and `.env.production`:
```bash
# Add:
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# Remove (no longer needed):
DATABASE_URL=
DATABASE_CONNECTION_STRING=
ZERO_URL=
REDIS_URL=
```

**K. Vercel Configuration**

Update `vercel.json` if it has database-related cron jobs or environment mappings.

---

## Migration Steps

### Step 1: Install Dependencies
```bash
cd app
pnpm install
```

### Step 2: Initialize Convex
```bash
npx convex dev
```
This will:
- Prompt you to create/login to Convex account
- Create a development deployment
- Generate `VITE_CONVEX_URL` in `.env.local`
- Generate types in `convex/_generated/`

### Step 3: Seed Models
```bash
# In Convex dashboard or via ConvexHttpClient:
await convex.mutation(api.models.seed);
```

### Step 4: Update Frontend Code
Follow the "What Remains To Be Done" section above to:
1. Replace `DatabaseProvider` with `ConvexProvider`
2. Convert all `useDatabase()` calls to `useQuery()/useMutation()`
3. Update API routes to use ConvexHttpClient
4. Remove/replace database context and hooks

### Step 5: Test
```bash
pnpm run dev
```
- Create account
- Start thread
- Send messages
- Test AI streaming
- Check settings/preferences
- Verify credit deduction

### Step 6: Deploy
```bash
npx convex deploy --prod
pnpm run build
# Deploy to Vercel
```

---

## Convex vs. Zero Comparison

| Feature | Zero (Rocicorp) | Convex |
|---------|-----------------|--------|
| **Database** | PostgreSQL | Convex (serverless) |
| **Sync** | Local-first with sync | Real-time subscriptions |
| **Queries** | SQL-like with Drizzle | TypeScript functions |
| **Offline** | Full offline support | Online-only (with retry) |
| **Auth** | Better Auth + Drizzle | Better Auth + Convex |
| **Real-time** | Automatic sync | Reactive queries |
| **Scaling** | Self-hosted Postgres | Auto-scaled by Convex |
| **Cost** | $0 (self-hosted) | Free tier + usage-based |

---

## Key Files Reference

### Convex Backend
```
convex/
├── schema.ts            # All tables defined
├── threads.ts           # Thread CRUD
├── messages.ts          # Message CRUD
├── models.ts            # AI model management
├── settings.ts          # User preferences
├── usage.ts             # Credit tracking
└── tsconfig.json        # Convex TypeScript config
```

### Frontend (needs update)
```
src/
├── routes/
│   ├── __root.tsx                         # Add ConvexProvider here
│   ├── _app.tsx                          # Main app layout
│   ├── _app._thread.$threadId.tsx        # Thread view (uses database)
│   └── api.thread.$threadId.stream.ts    # Streaming endpoint
├── context/
│   └── database.tsx                       # DELETE or replace
├── hooks/
│   ├── use-database.ts                    # DELETE
│   └── use-chats-by-time-range.ts        # Update to use Convex
└── components/
    ├── layout/app-sidebar.tsx             # Update thread queries
    └── thread/                            # Update all message components
```

---

## Testing Checklist

- [ ] Install dependencies (`pnpm install`)
- [ ] Initialize Convex (`npx convex dev`)
- [ ] Generate Convex types
- [ ] Seed models (`api.models.seed`)
- [ ] Replace DatabaseProvider with ConvexProvider
- [ ] Update all `useDatabase()` calls
- [ ] Update API routes
- [ ] Test user creation
- [ ] Test thread creation
- [ ] Test message sending
- [ ] Test AI streaming
- [ ] Test settings update
- [ ] Test credit deduction
- [ ] Test model selection
- [ ] Build for production
- [ ] Deploy Convex (`convex deploy`)
- [ ] Deploy to Vercel

---

## Need Help?

**Convex Docs:** https://docs.convex.dev
**Better Auth + Convex:** https://www.better-auth.com/docs/integrations/convex
**Streaming with Convex:** https://docs.convex.dev/production/streaming

---

## Notes

- **No Redis needed**: Convex handles real-time sync internally
- **No PostgreSQL needed**: Convex is the database
- **No migrations**: Schema changes are automatic in Convex
- **Authentication**: Better Auth works with Convex (just need adapter)
- **File storage**: Can use Convex storage or keep UploadThing
- **Stripe integration**: Unchanged - still handled in API routes

The zeronsh frontend is a **premium, production-ready chat UI** with:
- Multi-model AI support (25+ models)
- Real-time streaming
- File uploads
- Search/research tools
- Beautiful shadcn/ui components
- Responsive design
- Dark/light themes

By migrating to Convex, we get:
- Simpler deployment (no database to manage)
- Auto-scaling
- Built-in real-time updates
- Type-safe queries
- Better developer experience
