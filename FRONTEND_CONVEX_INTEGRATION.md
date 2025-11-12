# Frontend Convex Integration Status

## ✅ Completed

### 1. Core Infrastructure
- **ConvexProvider Setup** (`src/routes/__root.tsx`)
  - Replaced `DatabaseProvider` with `ConvexProvider`
  - Initialized `ConvexReactClient` with environment variable
  - Removed Zero/Drizzle imports from root component

### 2. Environment Configuration (`src/lib/env.ts`)
- ✅ Removed: `ZERO_UPSTREAM_DB`, `REDIS_URL`, `VITE_PUBLIC_ZERO_URL`
- ✅ Added: `CONVEX_DEPLOYMENT`, `VITE_PUBLIC_CONVEX_URL`

### 3. React Hooks (`src/hooks/use-database.ts`)
Converted all frontend hooks to use Convex:
- ✅ `useSettings()` → `useConvexQuery(api.settings.get)`
- ✅ `useThreads()` → `useConvexQuery(api.threads.list)`
- ✅ `useCustomer()` → `useConvexQuery(api.customers.get)`
- ✅ `useUsage()` → `useConvexQuery(api.usage.get)`
- ✅ `useThreadFromParams()` → Combined `api.threads.get` + `api.messages.list`
- ✅ `useUser()` → `useConvexQuery(api.users.getCurrent)`

### 4. Convex Backend Functions
Created supporting Convex queries:
- ✅ `convex/users.ts` - Get current user
- ✅ `convex/customers.ts` - Get subscription data
- ✅ `convex/threads.ts` - Thread CRUD operations
- ✅ `convex/messages.ts` - Message CRUD operations
- ✅ `convex/settings.ts` - User preferences
- ✅ `convex/usage.ts` - Credit tracking
- ✅ `convex/models.ts` - AI model management
- ✅ `convex/schema.ts` - Complete database schema

### 5. Authentication
- ✅ Created `convex/auth.config.ts` for Better Auth integration
- ⚠️  Note: Convex auth uses `ctx.auth.getUserIdentity()` which requires JWT setup

### 6. Cleanup
- ✅ Renamed old database context: `database.tsx.old`
- ✅ Updated package.json scripts (already done in backend migration)

---

## 🚧 Remaining Work

### Critical (Required for App to Function)

#### 1. Convex Initialization
```bash
cd app
npx convex dev
```
This will:
- Create Convex deployment
- Generate `convex/_generated/` directory with TypeScript types
- Set `VITE_PUBLIC_CONVEX_URL` in `.env.local`

#### 2. Better Auth + Convex Integration
The app currently uses Better Auth with Drizzle adapter. Need to either:

**Option A: Keep Hybrid (Recommended for now)**
- Keep Better Auth using Drizzle for authentication tables
- Use Convex for application data (threads, messages, settings)
- Sync user creation between both systems

**Option B: Full Convex Migration**
- Create Better Auth Convex adapter
- Migrate all auth tables to Convex
- Update `src/lib/auth.ts` to use Convex adapter

Current auth.ts uses:
```typescript
database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
}),
```

#### 3. API Routes Migration
API routes still use Drizzle + Effect architecture:
- `api.thread.ts` - Create thread and AI streaming
- `api.thread.$threadId.stream.ts` - Resume streaming
- `api.thread.$threadId.stop.ts` - Stop streaming

These routes use:
- `DatabaseLive` (Effect layer providing Drizzle instance)
- `queries.ts` (Drizzle-based database queries)
- `ai/service.ts` (Effect-based AI service layer)

**Migration Options:**

**Option A: Convert to ConvexHttpClient**
```typescript
import { ConvexHttpClient } from 'convex/browser';

const convex = new ConvexHttpClient(env.VITE_PUBLIC_CONVEX_URL);

// In API route:
const thread = await convex.query(api.threads.get, { id: threadId });
const messages = await convex.query(api.messages.list, { threadId });
await convex.mutation(api.threads.update, { id, status: 'streaming' });
```

**Option B: Keep Drizzle for Server-Side (Hybrid)**
- Frontend queries use Convex (realtime, reactive)
- API routes keep using Drizzle (established code, complex logic)
- Accept temporary dual-database architecture

#### 4. Database Queries Layer (`src/database/queries.ts`)
If choosing full migration, need to rewrite ~50 Effect-based queries:
- `getThreadById` → Convex query
- `getMessageById` → Convex query
- `createThread` → Convex mutation
- `updateThread` → Convex mutation
- `saveMessage` → Convex mutation
- etc.

#### 5. AI Service Layer (`src/ai/service.ts`)
Heavy Effect integration with Drizzle queries:
- `prepareThreadContext` - Fetches thread, messages, model, settings, usage
- `saveMessageAndResetThreadStatus` - Saves AI response
- `generateThreadTitle` - Updates thread title
- `incrementUsage` - Deducts credits

### Medium Priority

#### 6. Component Updates
Check if any components directly import database types or use old database patterns:
```bash
grep -r "from '@/database'" app/src/components
grep -r "useDatabase" app/src/components
grep -r "@rocicorp/zero" app/src
```

#### 7. Type Definitions
- Update types to use Convex IDs (`Id<"threads">` instead of string)
- Update `ThreadMessage` type if needed
- Ensure compatibility between Drizzle and Convex schemas

#### 8. Remove Old Files (After Full Migration)
- `src/database/schema.ts` - Drizzle schema
- `src/database/queries.ts` - Drizzle queries
- `src/database/effect.ts` - Effect database layer
- `src/context/database.tsx.old` - Old Zero context
- `drizzle.config.ts` - Drizzle configuration
- `drizzle/` directory - Migrations

---

## 🎯 Recommended Next Steps

### Immediate (to get app running)
1. Run `npx convex dev` to initialize Convex
2. Seed models: Create a script to run `api.models.seed` mutation
3. Test frontend components:
   - Thread list should load from Convex
   - Settings should load from Convex
   - User info should load from Convex

### Short-term (hybrid approach)
4. Keep API routes using Drizzle
5. Ensure user creation works in both databases
6. Test AI streaming with existing Drizzle backend
7. Verify credits deduction works

### Long-term (full migration)
8. Create ConvexHttpClient wrapper for API routes
9. Rewrite `queries.ts` to use Convex
10. Update `ai/service.ts` to use Convex
11. Migrate Better Auth to Convex adapter
12. Remove all Drizzle/PostgreSQL dependencies

---

## ⚠️ Known Issues

### 1. Convex _generated Directory Missing
The app will fail to compile because:
```typescript
import { api } from '../../convex/_generated/api';
```

**Fix:** Run `npx convex dev` to generate types.

### 2. Authentication Context
Convex functions use `ctx.auth.getUserIdentity()` which requires:
- JWT tokens from Better Auth
- Proper auth configuration in `convex/auth.config.ts`
- ConvexReactClient configured with auth

**Current Setup:**
```typescript
const convex = new ConvexReactClient(env.VITE_PUBLIC_CONVEX_URL);
```

**May Need:**
```typescript
import { ConvexProviderWithAuth } from "convex/react";

// Configure with Better Auth JWT
```

### 3. Dual Database State
Currently:
- Convex has schema but no data
- Drizzle (PostgreSQL) has existing data
- Need data migration or dual-write strategy

### 4. Effect Architecture
The existing codebase heavily uses Effect for:
- Database operations
- Error handling
- Async orchestration
- Transaction management

Convex doesn't use Effect, so API routes need refactoring.

---

## 📊 Migration Effort Estimate

| Task | Effort | Priority | Status |
|------|--------|----------|--------|
| Convex Dev Setup | 5 min | Critical | ⏳ Pending |
| Seed Initial Data | 10 min | Critical | ⏳ Pending |
| Frontend Testing | 30 min | High | ⏳ Pending |
| Auth Integration | 2-4 hours | High | ⏳ Pending |
| API Routes Migration | 4-6 hours | Medium | ⏳ Pending |
| Effect Layer Rewrite | 6-8 hours | Low | ⏳ Pending |
| Data Migration | 1-2 hours | Low | ⏳ Pending |
| Full Testing | 2-3 hours | High | ⏳ Pending |

**Total:** 16-26 hours for complete migration

---

## 🔄 Architecture Comparison

### Before (Drizzle + Zero)
```
Frontend Components
  ↓ useDatabase() (Zero client)
  ↓ Zero Queries (local-first sync)
  ↓ Zero Server
  ↓ PostgreSQL (Drizzle ORM)

API Routes
  ↓ Effect Layers
  ↓ Drizzle Queries
  ↓ PostgreSQL
```

### After (Full Convex)
```
Frontend Components
  ↓ useConvexQuery()
  ↓ Convex Client (realtime subscriptions)
  ↓ Convex Backend

API Routes
  ↓ ConvexHttpClient
  ↓ Convex Mutations
  ↓ Convex Backend
```

### Current (Hybrid)
```
Frontend Components
  ↓ useConvexQuery()
  ↓ Convex Client
  ↓ Convex Backend

API Routes (unchanged)
  ↓ Effect Layers
  ↓ Drizzle Queries
  ↓ PostgreSQL
```

---

## 🧪 Testing Checklist

### Phase 1: Convex Setup
- [ ] Run `npx convex dev` successfully
- [ ] Verify `convex/_generated/` directory created
- [ ] Check `VITE_PUBLIC_CONVEX_URL` in `.env.local`
- [ ] Run `pnpm install` (no errors)
- [ ] Run `pnpm run dev` (compiles successfully)

### Phase 2: Frontend Queries
- [ ] Homepage loads without errors
- [ ] Thread list displays (empty or with data)
- [ ] Settings page accessible
- [ ] User profile loads
- [ ] No console errors related to queries

### Phase 3: Data Population
- [ ] Seed models: `api.models.seed` mutation
- [ ] Create test user in Convex
- [ ] Create test thread
- [ ] Verify data appears in Convex dashboard

### Phase 4: API Integration
- [ ] Test thread creation via API
- [ ] Test AI streaming
- [ ] Test message saving
- [ ] Test credit deduction

### Phase 5: Authentication
- [ ] Sign in with Google
- [ ] Sign in with email
- [ ] Session persists across refresh
- [ ] Protected routes work

---

## 📚 Resources

- **Convex Docs:** https://docs.convex.dev
- **Convex + Better Auth:** https://www.better-auth.com/docs/integrations/convex
- **Convex Auth:** https://docs.convex.dev/auth
- **ConvexHttpClient:** https://docs.convex.dev/client/http
- **Effect Documentation:** https://effect.website

---

## 💡 Notes

### Why Hybrid Might Be Best
1. **Reduces Migration Risk:** Existing AI streaming code is complex
2. **Faster to Production:** Frontend benefits from Convex immediately
3. **Gradual Migration:** Can move API routes one by one
4. **Fallback Option:** If Convex has issues, API still works

### Why Full Migration is Better
1. **Single Source of Truth:** No sync issues between databases
2. **Simpler Architecture:** One database, one ORM pattern
3. **Better Performance:** Convex is optimized for serverless
4. **Real-time Everything:** API routes can use Convex subscriptions

### Decision Point
**Recommendation:** Start with hybrid, migrate API routes incrementally.

---

## 🐛 Debugging Tips

### If frontend queries fail:
1. Check Convex dashboard for errors
2. Verify auth token is being sent
3. Check browser console for Convex errors
4. Ensure `ctx.auth.getUserIdentity()` returns user

### If API routes fail:
1. Check if Drizzle/PostgreSQL still connected
2. Verify environment variables
3. Check Effect logs for errors

### If app won't compile:
1. Delete `node_modules` and `pnpm-lock.yaml`
2. Run `pnpm install`
3. Run `npx convex dev`
4. Restart dev server

---

**Last Updated:** 2025-11-12
**Branch:** `claude/build-core-mvp-nextjs-convex-011CV39EHHGCLwLKggy8qZpi`
