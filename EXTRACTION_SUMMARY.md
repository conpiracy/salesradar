# Zeronsh-Chat Extraction Summary

## Overview
Successfully extracted the complete zeronsh-chat codebase from the markdown file to `/home/user/salesradar/app`.

**Total Files Created: 212**

## Directory Structure

```
app/
├── .claude/                    # Claude settings
├── drizzle/                    # Database migrations (19 SQL files + metadata)
│   └── meta/                   # Migration metadata (19 snapshots)
├── public/                     # Public assets
├── src/                        # Source code
│   ├── ai/                     # AI integration (8 files)
│   │   └── tools/              # AI tools (search, research, deep-search)
│   ├── components/             # React components (83 files)
│   │   ├── ai-elements/        # AI-specific UI components
│   │   ├── app/                # App-level components
│   │   ├── icons/              # Icon components (15 providers)
│   │   ├── layout/             # Layout components
│   │   ├── meta/               # Meta components
│   │   ├── thread/             # Thread/chat components
│   │   │   └── message/        # Message components
│   │   │       └── part/       # Message part renderers
│   │   └── ui/                 # Shadcn UI components (27 components)
│   ├── context/                # React contexts
│   ├── database/               # Database schemas & queries (7 files)
│   ├── emails/                 # Email templates
│   ├── hooks/                  # Custom React hooks (8 files)
│   ├── lib/                    # Utility libraries (12 files)
│   ├── routes/                 # TanStack Router routes (26 files)
│   ├── stores/                 # State management
│   ├── thread/                 # Thread state management
│   └── zero/                   # Zero (Rocicorp) configuration
└── Configuration Files:
    ├── package.json            # Dependencies & scripts
    ├── tsconfig.json           # TypeScript configuration
    ├── vite.config.ts          # Vite configuration
    ├── drizzle.config.ts       # Drizzle ORM config
    ├── drizzle-zero.config.ts  # Zero sync config
    ├── components.json         # Shadcn UI config
    ├── docker-compose.yml      # Docker services (PostgreSQL, Redis)
    ├── vercel.json             # Vercel deployment config
    └── .prettierrc             # Code formatting rules
```

## Technology Stack

### Core Framework
- **TanStack Start** - Modern React meta-framework
- **React 19.1.0** - UI library
- **TypeScript 5.9.2** - Type safety
- **Vite 7.0.5** - Build tool

### Database & Sync
- **Drizzle ORM** - Type-safe database queries
- **PostgreSQL** - Primary database
- **Zero (Rocicorp)** - Real-time sync framework
- **Redis** - Caching layer

### AI & LLMs
- **Vercel AI SDK** - Unified AI interface
- Multiple providers:
  - Anthropic (Claude)
  - OpenAI (GPT)
  - Google (Gemini)
  - xAI (Grok)
  - DeepSeek
  - Alibaba (Qwen)
  - ZAI (GLM)
  - Moonshot (Kimi)

### UI Components
- **Shadcn/UI** - Component library
- **Radix UI** - Headless UI primitives
- **Tailwind CSS 4.0.6** - Styling
- **Framer Motion** - Animations
- **Lucide React** - Icons

### Authentication & Payments
- **Better Auth** - Authentication
- **Stripe** - Payment processing
- **Resend** - Email service
- **UploadThing** - File uploads

### AI Tools
- **Exa AI** - Search functionality
- Custom tools for research and deep search

## Key Features Implemented

1. **Multi-Model AI Chat**
   - Support for 25+ AI models from 8+ providers
   - Model switching within conversations
   - Capability badges (tools, vision, reasoning, documents)

2. **Thread Management**
   - Real-time sync with Zero
   - Resumable streams
   - Chat history organization by time ranges

3. **AI Tools**
   - Web search integration (Exa)
   - Research tool
   - Deep search capabilities
   - Document processing

4. **Authentication**
   - Magic link login
   - Anonymous users
   - Organization support

5. **Subscription System**
   - Credit-based usage tracking
   - Premium model access
   - Stripe integration

6. **Database Schema**
   - Users, sessions, organizations
   - Threads and messages
   - Models and settings
   - Usage tracking
   - Customer subscriptions

## Files by Category

- **Components**: 83 files
- **Routes**: 26 files
- **Database**: 7 files
- **Hooks**: 8 files
- **Libraries**: 12 files
- **AI**: 8 files
- **Migrations**: 19 SQL files

## Next Steps

### To Replace Drizzle with Convex:

1. **Install Convex**
   ```bash
   cd /home/user/salesradar/app
   npm install convex
   npx convex dev
   ```

2. **Files to Replace/Modify**:
   - `src/database/` - Replace Drizzle schemas with Convex schemas
   - `src/database/queries.ts` - Convert to Convex queries/mutations
   - `src/context/database.tsx` - Update to use Convex context
   - `drizzle.config.ts` - Remove (Convex specific)
   - `drizzle-zero.config.ts` - Remove (Zero specific)

3. **Key Differences**:
   - Convex uses TypeScript schema definitions instead of SQL migrations
   - Real-time subscriptions are built-in (no need for Zero)
   - Serverless functions instead of API routes
   - Built-in authentication system

4. **Schema Migration Strategy**:
   - Examine `src/database/schema.ts` and `src/database/app-schema.ts`
   - Convert to Convex schema format in `convex/schema.ts`
   - Tables to migrate:
     - users, sessions, organizations
     - threads, messages
     - models, settings
     - usage tracking
     - customer data

## Important Notes

1. **Environment Variables**: The `.env.production` file contains encrypted values using dotenvx. You'll need to set up proper environment variables.

2. **Database Setup**: The app uses PostgreSQL for Drizzle + Zero. When moving to Convex, this won't be needed.

3. **Dependencies**: The project uses `pnpm` as the package manager (see `pnpm-workspace.yaml`).

4. **Build System**: Uses Vite with TanStack Start plugin for SSR capabilities.

5. **Authentication**: Currently uses Better Auth with magic link authentication.

## Running the Original App

```bash
cd /home/user/salesradar/app

# Install dependencies
pnpm install

# Set up environment variables (you'll need to configure these)
cp .env.production .env.local

# Run database (requires Docker)
docker-compose up -d

# Run development server
pnpm dev
```

## Repository Information

- **Original Project**: Zeron Chat
- **License**: MIT
- **Description**: A unified AI chat app with models from Claude, OpenAI, Gemini, and more
- **Key Features**: Resumable streams, fast navigation, integrated search & research tools, theming
