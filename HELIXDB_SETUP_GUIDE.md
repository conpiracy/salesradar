# HelixDB Setup Guide for Zeron (SalesRadar)

This guide walks you through setting up HelixDB as a custom knowledgebase for the Zeron AI chat system.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Project Setup](#project-setup)
4. [Schema Design for Zeron](#schema-design)
5. [Integration with Convex](#integration-with-convex)
6. [Testing](#testing)
7. [Production Deployment](#production-deployment)

---

## Prerequisites

Before you start:

- ✅ Node.js 20+ (you already have this)
- ✅ Python 3.8+ (optional, for Python SDK)
- ✅ Linux/macOS (HelixDB currently supports Unix-based systems)
- ✅ Your existing Convex + Next.js stack (unchanged)

---

## Installation

### Step 1: Install HelixDB CLI

```bash
# Install the Helix CLI
curl -sSL "https://install.helix-db.com" | bash

# Verify installation
helix --version
```

**Expected Output:**
```
helix version x.x.x
```

### Step 2: Install SDK (Choose One or Both)

#### TypeScript SDK (Recommended for Next.js integration)

```bash
cd app
npm install helix-ts
```

#### Python SDK (Optional, for advanced scripts)

```bash
pip install helix-db
```

---

## Project Setup

### Step 1: Initialize HelixDB Project

Create a separate directory for HelixDB schema and queries:

```bash
# From your project root
mkdir helix-kb
cd helix-kb

# Initialize Helix project
helix init
```

This creates:
```
helix-kb/
├── helix.toml          # Configuration file
├── schema/             # Schema definitions (.hx files)
└── queries/            # Query definitions (.hx files)
```

### Step 2: Configure helix.toml

Edit `helix-kb/helix.toml`:

```toml
[project]
name = "zeron-knowledgebase"
version = "0.1.0"

[server]
port = 6969
host = "127.0.0.1"

[embeddings]
provider = "openai"           # or "anthropic", "local"
model = "text-embedding-3-small"
api_key_env = "OPENAI_API_KEY"  # Read from environment variable

[dev]
auto_reload = true
```

### Step 3: Add Environment Variables

Add to your `.env.local` (or `app/.env.local`):

```env
# HelixDB Configuration
HELIX_DB_URL=http://localhost:6969
OPENAI_API_KEY=your_openai_key_here

# For embeddings - HelixDB will use this automatically
# Or use ANTHROPIC_API_KEY if you prefer Anthropic embeddings
```

---

## Schema Design for Zeron

### Step 4: Create Schema File

Create `helix-kb/schema/zeron.hx`:

```hql
// Node Types for Zeron Knowledge Graph

// Seller node with vector embedding
N::Seller {
  INDEX id: String,              // Convex seller ID
  handle: String,
  bio: String,
  email: String,
  niches: Array<String>,
  is_certified: Bool,
  bio_embedding: Vector<1536>,   // OpenAI embedding of bio
  created_at: U64
}

// Lesson node with vector embedding
N::Lesson {
  INDEX slug: String,
  title: String,
  content: String,
  order_index: U32,
  content_embedding: Vector<1536>,  // Semantic search on content
  created_at: U64
}

// Opportunity node with vector embedding
N::Opportunity {
  INDEX id: String,
  title: String,
  description: String,
  url: String,
  source: String,                   // "upwork", "freelancer", etc.
  niche: String,
  description_embedding: Vector<1536>,
  posted_at: U64
}

// Custom knowledgebase entries (AI-learned facts)
N::KnowledgeFact {
  INDEX id: String,
  fact: String,
  source: String,                   // "user_conversation", "system", "document"
  seller_id: String?,               // Optional - fact specific to a seller
  fact_embedding: Vector<1536>,
  created_at: U64,
  confidence: F32                   // 0.0 to 1.0
}

// Edge Types (Relationships)

// Seller completed a lesson
E::COMPLETED {
  FROM Seller TO Lesson,
  completed_at: U64,
  score: F32?
}

// Seller clicked an opportunity
E::CLICKED {
  FROM Seller TO Opportunity,
  clicked_at: U64
}

// Lessons are similar (computed via embeddings)
E::SIMILAR_TO {
  FROM Lesson TO Lesson,
  similarity: F32                   // Cosine similarity score
}

// Opportunities match seller's profile
E::MATCHES {
  FROM Opportunity TO Seller,
  match_score: F32,
  computed_at: U64
}

// Knowledge fact relates to a seller
E::RELATES_TO {
  FROM KnowledgeFact TO Seller,
  relevance: F32
}
```

### Step 5: Create Query Definitions

Create `helix-kb/queries/zeron_queries.hx`:

```hql
// Query 1: Find opportunities matching seller's completed lessons
QUERY findRelevantOpportunities(seller_id: String, limit: U32) =>
  seller <- N<Seller>({ id: seller_id })
  completed <- E<COMPLETED>(seller, _)
  lessons <- completed.TO

  // Find opportunities with similar embeddings to completed lessons
  opps <- N<Opportunity>
  WHERE vector_similarity(opps.description_embedding, lessons.content_embedding) > 0.7
  AND NOT EXISTS E<CLICKED>(seller, opps)

  RETURN opps
  ORDER BY vector_similarity(opps.description_embedding, lessons.content_embedding) DESC
  LIMIT limit

// Query 2: Semantic search across all knowledge
QUERY semanticSearch(query_text: String, limit: U32) =>
  query_embedding <- embed(query_text)

  facts <- N<KnowledgeFact>
  WHERE vector_similarity(facts.fact_embedding, query_embedding) > 0.6

  RETURN facts
  ORDER BY vector_similarity(facts.fact_embedding, query_embedding) DESC
  LIMIT limit

// Query 3: Get seller's learning context (for personalized chat)
QUERY getSellerContext(seller_id: String) =>
  seller <- N<Seller>({ id: seller_id })

  // Get completed lessons
  completed_edges <- E<COMPLETED>(seller, _)
  completed_lessons <- completed_edges.TO

  // Get clicked opportunities
  clicked_edges <- E<CLICKED>(seller, _)
  clicked_opps <- clicked_edges.TO

  // Get personalized knowledge facts
  fact_edges <- E<RELATES_TO>(_, seller)
  related_facts <- fact_edges.FROM

  RETURN {
    seller: seller,
    completed_lessons: completed_lessons,
    clicked_opportunities: clicked_opps,
    knowledge: related_facts
  }

// Query 4: Find similar sellers (for recommendations)
QUERY findSimilarSellers(seller_id: String, limit: U32) =>
  seller <- N<Seller>({ id: seller_id })

  other_sellers <- N<Seller>
  WHERE other_sellers.id != seller_id
  AND vector_similarity(other_sellers.bio_embedding, seller.bio_embedding) > 0.75

  RETURN other_sellers
  ORDER BY vector_similarity(other_sellers.bio_embedding, seller.bio_embedding) DESC
  LIMIT limit

// Query 5: Add a knowledge fact (from AI conversation)
MUTATION addKnowledgeFact(
  fact: String,
  source: String,
  seller_id: String?,
  confidence: F32
) =>
  fact_embedding <- embed(fact)

  fact_node <- CREATE N<KnowledgeFact> {
    id: uuid(),
    fact: fact,
    source: source,
    seller_id: seller_id,
    fact_embedding: fact_embedding,
    created_at: now(),
    confidence: confidence
  }

  // If seller-specific, create relationship
  IF seller_id IS NOT NULL THEN
    seller <- N<Seller>({ id: seller_id })
    CREATE E<RELATES_TO>(fact_node, seller) { relevance: confidence }
  END

  RETURN fact_node
```

### Step 6: Validate Schema

Check your schema for errors:

```bash
cd helix-kb
helix check
```

**Expected Output:**
```
✓ Schema validation passed
✓ Queries compiled successfully
```

---

## Integration with Convex

Now integrate HelixDB with your existing Convex stack.

### Step 7: Start HelixDB Server

```bash
cd helix-kb
helix push dev
```

This starts the HelixDB server on `http://localhost:6969`.

**Keep this running in a terminal tab.**

### Step 8: Create Convex Action to Call HelixDB

Create `app/convex/helix.ts`:

```typescript
"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Helper function to call HelixDB
async function callHelix(queryName: string, params: Record<string, any>) {
  const helixUrl = process.env.HELIX_DB_URL || "http://localhost:6969";

  const response = await fetch(`${helixUrl}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: queryName,
      params: params,
    }),
  });

  if (!response.ok) {
    throw new Error(`HelixDB error: ${response.statusText}`);
  }

  return await response.json();
}

// Action: Sync seller to HelixDB
export const syncSellerToHelix = action({
  args: { sellerId: v.id("sellers") },
  handler: async (ctx, args) => {
    // 1. Get seller from Convex
    const seller = await ctx.runQuery(api.sellers.publicSeller, {
      sellerId: args.sellerId,
    });

    if (!seller) {
      throw new Error("Seller not found");
    }

    // 2. Insert into HelixDB (it will auto-generate embeddings)
    const result = await callHelix("createSeller", {
      id: seller._id,
      handle: seller.handle,
      bio: seller.bio || "",
      email: seller.email,
      niches: seller.niches || [],
      is_certified: seller.isCertified || false,
      created_at: seller._creationTime,
    });

    return result;
  },
});

// Action: Find relevant opportunities for a seller
export const findRelevantOpportunities = action({
  args: {
    sellerId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const result = await callHelix("findRelevantOpportunities", {
      seller_id: args.sellerId,
      limit: args.limit || 10,
    });

    return result;
  },
});

// Action: Semantic search in knowledgebase
export const semanticSearch = action({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const result = await callHelix("semanticSearch", {
      query_text: args.query,
      limit: args.limit || 10,
    });

    return result;
  },
});

// Action: Get seller context for AI chat
export const getSellerContext = action({
  args: { sellerId: v.string() },
  handler: async (ctx, args) => {
    const result = await callHelix("getSellerContext", {
      seller_id: args.sellerId,
    });

    return result;
  },
});

// Action: Add knowledge fact from AI conversation
export const addKnowledgeFact = action({
  args: {
    fact: v.string(),
    source: v.string(),
    sellerId: v.optional(v.string()),
    confidence: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const result = await callHelix("addKnowledgeFact", {
      fact: args.fact,
      source: args.source,
      seller_id: args.sellerId,
      confidence: args.confidence || 0.8,
    });

    return result;
  },
});
```

### Step 9: Create Chat Action with HelixDB Knowledge

Create `app/convex/chat.ts`:

```typescript
"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const chatWithKnowledge = action({
  args: {
    sellerId: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Get seller context from HelixDB
    const context = await ctx.runAction(api.helix.getSellerContext, {
      sellerId: args.sellerId,
    });

    // 2. Semantic search for relevant knowledge
    const knowledge = await ctx.runAction(api.helix.semanticSearch, {
      query: args.message,
      limit: 5,
    });

    // 3. Find relevant opportunities
    const opportunities = await ctx.runAction(api.helix.findRelevantOpportunities, {
      sellerId: args.sellerId,
      limit: 3,
    });

    // 4. Build context for LLM
    const systemContext = `
Seller Profile:
- Handle: ${context.seller.handle}
- Niches: ${context.seller.niches.join(", ")}
- Certified: ${context.seller.is_certified}
- Completed Lessons: ${context.completed_lessons.length}

Relevant Knowledge:
${knowledge.map((k: any) => `- ${k.fact} (confidence: ${k.confidence})`).join("\n")}

Recommended Opportunities:
${opportunities.slice(0, 3).map((o: any) => `- ${o.title} (${o.source})`).join("\n")}
    `;

    // 5. Call Claude with enriched context
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2048,
        system: `You are a helpful sales assistant for SalesRadar/Zeron. Use the following context to provide personalized recommendations:\n\n${systemContext}`,
        messages: [
          {
            role: "user",
            content: args.message,
          },
        ],
      }),
    });

    const response = await claudeResponse.json();

    // 6. Extract learnings and add to knowledgebase
    const assistantMessage = response.content[0].text;

    // Simple heuristic: if the assistant made a recommendation, store it
    if (assistantMessage.toLowerCase().includes("recommend") ||
        assistantMessage.toLowerCase().includes("suggest")) {
      await ctx.runAction(api.helix.addKnowledgeFact, {
        fact: `User asked about: "${args.message}". Assistant recommended opportunities in their niche.`,
        source: "ai_conversation",
        sellerId: args.sellerId,
        confidence: 0.7,
      });
    }

    return {
      message: assistantMessage,
      context_used: {
        completed_lessons: context.completed_lessons.length,
        knowledge_facts: knowledge.length,
        opportunities_found: opportunities.length,
      },
    };
  },
});
```

---

## Testing

### Step 10: Test HelixDB Integration

Create a test script `test-helix.ts`:

```typescript
// Run with: npx tsx test-helix.ts
import { ConvexHttpClient } from "convex/browser";
import { api } from "./app/convex/_generated/api";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function test() {
  console.log("🧪 Testing HelixDB Integration\n");

  // Test 1: Sync a seller
  console.log("1️⃣ Syncing seller to HelixDB...");
  const syncResult = await client.action(api.helix.syncSellerToHelix, {
    sellerId: "your_seller_id_here", // Replace with actual seller ID
  });
  console.log("✅ Sync result:", syncResult);

  // Test 2: Semantic search
  console.log("\n2️⃣ Testing semantic search...");
  const searchResult = await client.action(api.helix.semanticSearch, {
    query: "sales opportunities in SaaS",
    limit: 3,
  });
  console.log("✅ Search results:", searchResult);

  // Test 3: Chat with knowledge
  console.log("\n3️⃣ Testing AI chat with knowledge...");
  const chatResult = await client.action(api.chat.chatWithKnowledge, {
    sellerId: "your_seller_id_here",
    message: "What opportunities match my skills?",
  });
  console.log("✅ Chat response:", chatResult);
}

test().catch(console.error);
```

Run the test:

```bash
npx tsx test-helix.ts
```

### Step 11: Test from UI

Add a simple test page `app/app/test-helix/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function TestHelixPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(null);

  const semanticSearch = useAction(api.helix.semanticSearch);
  const chat = useAction(api.chat.chatWithKnowledge);

  const handleSearch = async () => {
    const res = await semanticSearch({ query, limit: 5 });
    setResult(res);
  };

  const handleChat = async () => {
    const res = await chat({
      sellerId: "test_seller_id", // Replace with real ID
      message: query,
    });
    setResult(res);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">HelixDB Test</h1>

      <div className="space-y-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your query..."
          className="w-full p-2 border rounded"
        />

        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Semantic Search
          </button>

          <button
            onClick={handleChat}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Chat with Knowledge
          </button>
        </div>

        {result && (
          <pre className="p-4 bg-gray-100 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
```

Visit `http://localhost:3000/test-helix` to test.

---

## Production Deployment

### Step 12: Deploy HelixDB

#### Option A: Self-Hosted

1. **Deploy to a VPS** (DigitalOcean, AWS EC2, etc.):

```bash
# On your production server
curl -sSL "https://install.helix-db.com" | bash
cd /var/helix-kb
helix push production
```

2. **Set up systemd service** (`/etc/systemd/system/helix.service`):

```ini
[Unit]
Description=HelixDB Server
After=network.target

[Service]
Type=simple
User=helix
WorkingDirectory=/var/helix-kb
ExecStart=/usr/local/bin/helix serve
Restart=always
Environment="OPENAI_API_KEY=your_key_here"

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable helix
sudo systemctl start helix
```

3. **Update your Convex environment**:

```bash
# In your Convex dashboard or .env
HELIX_DB_URL=https://your-helix-server.com:6969
```

#### Option B: Managed Cloud (Waitlist)

Sign up for HelixDB managed cloud at https://helix-db.com (currently in waitlist).

---

## Next Steps

Now that HelixDB is set up:

1. **Populate Data**:
   - Sync your existing sellers, lessons, and opportunities from Convex to HelixDB
   - Create a migration script to bulk sync

2. **Build Chat UI**:
   - Create a chat interface that calls `api.chat.chatWithKnowledge`
   - Display recommended opportunities inline

3. **Optimize**:
   - Fine-tune similarity thresholds (currently 0.7)
   - Adjust embedding models
   - Add caching for frequently accessed knowledge

4. **Monitor**:
   - Track query performance
   - Monitor knowledgebase growth
   - Review AI-generated knowledge facts for quality

---

## Troubleshooting

### HelixDB server won't start

```bash
# Check logs
helix logs

# Verify port is available
lsof -i :6969

# Try a different port in helix.toml
```

### Embeddings not generating

```bash
# Verify OpenAI API key
echo $OPENAI_API_KEY

# Check helix.toml configuration
# Ensure embeddings.api_key_env matches your env var name
```

### Queries failing

```bash
# Validate schema
helix check

# View query compilation errors
helix build --verbose
```

### Slow query performance

- **Add indexes** to frequently queried fields
- **Reduce vector dimensions** (use smaller embedding models)
- **Limit result sets** with appropriate LIMIT clauses

---

## Resources

- **HelixDB Docs**: https://docs.helix-db.com (check for latest)
- **GitHub**: https://github.com/HelixDB/helix-db
- **Community**: Join the HelixDB Discord for support
- **Examples**: https://github.com/HelixDB/helix-db/tree/main/examples

---

## Summary

You now have:
- ✅ HelixDB installed and running locally
- ✅ Schema designed for Zeron's use case
- ✅ Queries for semantic search and graph traversal
- ✅ Convex actions to call HelixDB
- ✅ AI chat with knowledgebase integration
- ✅ Test environment to validate everything

Your stack now looks like:

```
┌─────────────────────────┐
│   Next.js Frontend      │
└───────────┬─────────────┘
            │
    ┌───────┴────────┐
    ▼                ▼
┌─────────┐    ┌──────────┐
│ Convex  │    │ HelixDB  │
│(sellers,│    │(knowledge│
│lessons, │    │ graph,   │
│ opps)   │    │ vectors) │
└────┬────┘    └────┬─────┘
     │              │
     └──────┬───────┘
            ▼
    ┌──────────────┐
    │   Claude AI  │
    └──────────────┘
```

**Convex**: Handles your core data and real-time updates
**HelixDB**: Provides semantic search and knowledge graph
**Claude**: Generates responses using both data sources

Happy building! 🚀
