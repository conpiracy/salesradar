# Custom Knowledgebase for Zeron AI Chat: Implementation Guide

## Executive Summary

This document compares **Mem0.ai** vs **HelixDB** for implementing a custom knowledgebase in the Zeron (SalesRadar) AI chat system.

**Quick Recommendation**: For most use cases, **Mem0** is recommended as it provides a complete memory layer with minimal setup. Choose **HelixDB** if you need advanced graph relationships and knowledge graphs.

**IMPORTANT**: Both solutions integrate **alongside** your existing Convex stack via API calls - no migration needed! Convex continues to handle your core data (sellers, lessons, opportunities) while Mem0/HelixDB adds AI memory and knowledgebase capabilities.

---

## Current State

**Status**: No AI chat implementation exists in SalesRadar MVP yet.

**What's Needed**:
- AI/LLM integration (Claude, OpenAI, etc.)
- Conversation storage schema
- Message history management
- Custom knowledgebase/memory system ← This document focuses here

---

## Integration Approach

**Both Mem0 and HelixDB integrate via API calls - Convex stays as-is!**

```
Your Current Stack (UNCHANGED):
┌─────────────────────────────┐
│  Next.js 15 (Frontend)      │
│  + Convex (Backend/DB)      │
│  ↓                           │
│  sellers, lessons, opps     │ ← Your existing data stays here
└─────────────────────────────┘

Add Knowledgebase (NEW):
┌─────────────────────────────┐
│  API Calls from:            │
│  - Next.js Server Actions   │ ← Call Mem0/HelixDB APIs from here
│  - Convex Actions           │ ← Or from here
│  ↓                           │
│  Mem0 API or HelixDB API    │ ← Memory/knowledgebase lives here
└─────────────────────────────┘
```

**How it works**:
1. **Keep Convex** for all existing data (sellers, lessons, opportunities)
2. **Add Mem0 or HelixDB** as an additional API service for AI memory/knowledgebase
3. **Call their APIs** from Next.js Server Actions or Convex actions
4. **No migration needed** - just API integration

**Where to make API calls**:
- **Option A**: Next.js Server Actions (`app/actions/chat.ts`) - Simple, direct
- **Option B**: Convex Actions (`convex/chat.ts`) - If you want Convex to orchestrate

Both work! Choose based on where you want your LLM logic to live.

---

## Solution Comparison

### Mem0.ai - Memory Layer Framework

#### What It Is
A **universal memory layer** that adds persistent, self-improving memory capabilities to AI applications. It sits on top of your existing database infrastructure.

#### Key Features
- **Multi-Level Memory**:
  - User memory (individual preferences)
  - Session memory (conversation context)
  - AI agent memory (operational context)

- **Smart Compression**: Compresses chat history into optimized memory representations, reducing token usage and latency

- **Hybrid Database Support**: Combines vector, key-value, and graph databases internally

- **Easy Integration**: One-line install with minimal configuration

- **Ecosystem Support**: Works with OpenAI, Anthropic (Claude), LangChain, LangGraph, CrewAI

- **Multi-Language**: Python and JavaScript SDKs

- **Compliance**: SOC 2 & HIPAA compliant, supports BYOK (Bring Your Own Key)

#### Architecture
```
┌─────────────────┐
│   Your AI App   │
│  (Zeron Chat)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Mem0 Layer    │ ← Memory extraction, consolidation, retrieval
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Vector DBs     │ ← Qdrant, Chroma, pgvector, Milvus, Weaviate
│  (Your Choice)  │
└─────────────────┘
```

#### Pricing
- **Platform (Managed)**: Hosted solution with pricing tiers (check mem0.ai/pricing)
- **Open Source**: Free, self-hosted option (41k+ GitHub stars)

#### Use Cases
- ✅ Personalized AI assistants
- ✅ Customer support bots with user history
- ✅ AI agents that learn from interactions
- ✅ Context-aware chatbots

#### Technical Specs
- **Response Time**: 91% lower than full-context approaches
- **Integration**: Works with existing LLM infrastructure
- **Deployment**: Managed cloud or self-hosted
- **Supported Vector DBs**: Qdrant, Chroma, pgvector, Milvus, Weaviate

---

### HelixDB - Graph-Vector Database

#### What It Is
A **native graph-vector database** built in Rust that unifies vector similarity search with graph traversal in a single database system.

#### Key Features
- **Dual Data Model**: Combines vector embeddings with graph relationships natively

- **Type-Safe Queries**: HQL (HelixDB Query Language) with real-time feedback and autocomplete

- **High Performance**:
  - Vector similarity: ~2ms
  - Graph traversals: <1ms
  - 1000x faster than Neo4j, 100x faster than TigerGraph

- **Unified Platform**: Single database for vectors, graphs, KV, documents, and relational data

- **Built-in RAG Support**: Vector search, keyword search, and graph traversals in one query

- **MCP Support**: Allows AI agents to discover data and walk the graph

- **Cost Reduction**: Eliminates need for separate vector DB, graph DB, and application DB (up to 50% cost savings)

#### Architecture
```
┌─────────────────┐
│   Your AI App   │
│  (Zeron Chat)   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│         HelixDB                 │
│  ┌──────────┐   ┌────────────┐ │
│  │ Vector   │   │   Graph    │ │ ← Single unified database
│  │ Search   │   │ Traversal  │ │
│  └──────────┘   └────────────┘ │
│         Storage Engine          │
│           (LMDB + Rust)         │
└─────────────────────────────────┘
```

#### Pricing
- **Open Source**: Free (Apache 2.0 license)
- **Managed Cloud**: Waitlist available, pricing TBD

#### Use Cases
- ✅ GraphRAG systems (relationships + semantic search)
- ✅ Knowledge graphs with embedding search
- ✅ AI agents needing contextual awareness through relationships
- ✅ Applications requiring complex data relationships

#### Technical Specs
- **Language**: Rust
- **Storage**: LMDB
- **Query Language**: HQL (Helix Query Language)
- **SDKs**: Python, REST API, CLI
- **Deployment**: Self-hosted or managed cloud

---

## Side-by-Side Comparison

| Feature | Mem0 | HelixDB |
|---------|------|---------|
| **Type** | Memory layer/framework | Native database |
| **Primary Purpose** | User/session memory management | Graph-vector unified storage |
| **Architecture** | Layer on top of vector DBs | Standalone database |
| **Performance** | 91% lower response time vs full-context | 2ms vector, <1ms graph |
| **Integration Complexity** | Very Easy (one-line install) | Moderate (new database) |
| **Language** | Python, JavaScript | Rust (Python SDK) |
| **Data Model** | Memory entities (user/session/agent) | Graph + Vector + KV/Doc/Relational |
| **Vector DB Support** | Qdrant, Chroma, pgvector, Milvus, Weaviate | Built-in |
| **Graph Support** | Yes (via graph memory representation) | Native first-class support |
| **Best For** | Memory & personalization | Complex relationships + RAG |
| **Ecosystem** | OpenAI, Anthropic, LangChain, CrewAI | Generic (works with any LLM) |
| **Managed Service** | Yes | Waitlist |
| **Open Source** | Yes (41k+ stars) | Yes |
| **Compliance** | SOC 2, HIPAA | TBD |
| **Maturity** | High (13M+ downloads) | Early (Y Combinator W25) |
| **Cost** | Tiered pricing or free OSS | Free OSS or managed TBD |

---

## Implementation Scenarios for Zeron

### Scenario 1: Basic AI Chat with User Memory (Recommended)

**Use Mem0**

**Rationale**:
- Quick to integrate with Convex backend
- Works seamlessly with Claude/OpenAI
- Handles user preferences and conversation history automatically
- Minimal code changes

**Implementation Steps**:

1. **Install Mem0**
```bash
cd app
npm install mem0ai
# or
pip install mem0ai
```

2. **Add Environment Variables** (`app/.env`)
```env
MEM0_API_KEY=your_mem0_api_key
ANTHROPIC_API_KEY=your_anthropic_key
```

3. **Update Convex Schema** (`convex/schema.ts`)
```typescript
// Add minimal schema for chat
conversations: defineTable({
  sellerId: v.id("sellers"),
  title: v.string(),
  mem0ConversationId: v.optional(v.string()), // Mem0 handles the rest
  createdAt: v.number(),
}).index("by_seller", ["sellerId"]),

messages: defineTable({
  conversationId: v.id("conversations"),
  role: v.string(),
  content: v.string(),
  createdAt: v.number(),
}).index("by_conversation", ["conversationId"]),
```

4. **Create Chat API** (Next.js Server Action or Convex function)
```typescript
// app/actions/chat.ts
import { MemoryClient } from 'mem0ai';
import Anthropic from '@anthropic-ai/sdk';

const mem0 = new MemoryClient(process.env.MEM0_API_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function sendMessage(userId: string, message: string) {
  // 1. Get user's memories
  const memories = await mem0.search(message, { user_id: userId });

  // 2. Build context from memories
  const context = memories.map(m => m.memory).join('\n');

  // 3. Send to Claude with context
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Context from user history:\n${context}\n\nUser message: ${message}`
    }]
  });

  // 4. Add to memory
  await mem0.add(message, { user_id: userId, metadata: { type: 'chat' } });
  await mem0.add(response.content[0].text, { user_id: userId, metadata: { type: 'response' } });

  return response.content[0].text;
}
```

5. **Add Chat UI** (`app/chat/page.tsx`)
```tsx
'use client';
import { useState } from 'react';
import { sendMessage } from '@/actions/chat';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const handleSend = async () => {
    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);

    const response = await sendMessage('seller_id', input);
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-4 ${msg.role}`}>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>
      <div className="p-4 border-t">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="Ask me anything..."
        />
        <button onClick={handleSend} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
          Send
        </button>
      </div>
    </div>
  );
}
```

**Time to Implement**: 2-4 hours

---

### Scenario 2: Advanced RAG with Knowledge Graph

**Use HelixDB (Alongside Convex)**

**Rationale**:
- Need to model relationships between sellers, opportunities, lessons, and completions
- Want semantic search combined with graph traversal
- Building complex recommendation engine
- HelixDB handles knowledgebase/RAG, Convex keeps your existing data

**Note**: You can optionally sync data from Convex to HelixDB, OR just use HelixDB as a separate knowledgebase API. Both approaches work - integrate via REST API or Python SDK from Next.js Server Actions or Convex actions.

**Implementation Steps**:

1. **Install HelixDB**
```bash
# Local installation
curl -fsSL https://helix-db.com/install.sh | sh

# Start HelixDB server
helix-db start
```

2. **Install Python SDK**
```bash
pip install helix-db
```

3. **Define Schema** (HQL)
```python
# scripts/setup_helix.py
from helix_db import HelixDB

db = HelixDB()

# Define vector-graph schema
schema = """
CREATE GRAPH SalesRadar {
  NODE Seller {
    id: String,
    handle: String,
    bio: String,
    embedding: Vector<1536>  // OpenAI embedding
  }

  NODE Lesson {
    id: String,
    title: String,
    content: String,
    embedding: Vector<1536>
  }

  NODE Opportunity {
    id: String,
    title: String,
    description: String,
    embedding: Vector<1536>
  }

  EDGE COMPLETED {
    FROM Seller TO Lesson,
    completed_at: Timestamp
  }

  EDGE CLICKED {
    FROM Seller TO Opportunity,
    clicked_at: Timestamp
  }

  EDGE SIMILAR_TO {
    FROM Lesson TO Lesson,
    similarity: Float
  }
}
"""

db.execute(schema)
```

4. **Sync Convex Data to HelixDB**
```typescript
// convex/sync_to_helix.ts
import { mutation } from "./_generated/server";

export const syncSellerToHelix = mutation({
  args: { sellerId: v.id("sellers") },
  handler: async (ctx, args) => {
    const seller = await ctx.db.get(args.sellerId);

    // Generate embedding
    const embedding = await generateEmbedding(seller.bio);

    // Insert to HelixDB
    await fetch('http://localhost:6969/query', {
      method: 'POST',
      body: JSON.stringify({
        query: `
          MERGE (s:Seller {id: $id})
          SET s.handle = $handle,
              s.bio = $bio,
              s.embedding = $embedding
        `,
        params: {
          id: seller._id,
          handle: seller.handle,
          bio: seller.bio,
          embedding
        }
      })
    });
  }
});
```

5. **Query with Graph + Vector**
```python
# Chat with knowledge graph
from helix_db import HelixDB

db = HelixDB()

def chat_with_knowledge_graph(seller_id: str, query: str):
    # Generate query embedding
    query_embedding = generate_embedding(query)

    # Hybrid query: vector similarity + graph traversal
    result = db.query("""
        // Find similar lessons
        MATCH (s:Seller {id: $seller_id})-[:COMPLETED]->(completed:Lesson)

        // Vector search for similar content
        MATCH (lesson:Lesson)
        WHERE vector_similarity(lesson.embedding, $query_embedding) > 0.7

        // Find opportunities similar to completed lessons
        MATCH (lesson)-[:SIMILAR_TO]->(opp:Opportunity)
        WHERE NOT (s)-[:CLICKED]->(opp)

        RETURN lesson, opp
        ORDER BY vector_similarity(lesson.embedding, $query_embedding) DESC
        LIMIT 5
    """, {
        'seller_id': seller_id,
        'query_embedding': query_embedding
    })

    # Use results as context for LLM
    context = format_results(result)
    return call_claude_with_context(query, context)
```

**Time to Implement**: 1-2 weeks (includes data modeling)

---

### Scenario 3: Hybrid Approach (Best of Both)

**Use Mem0 + Keep Convex**

**Rationale**:
- Convex already handles structured data well
- Add Mem0 for memory/personalization layer
- No need to migrate existing data
- Best balance of simplicity and power

**Architecture**:
```
┌──────────────────────────────────────┐
│        Zeron Chat Interface          │
└───────────┬──────────────────────────┘
            │
            ▼
┌───────────────────────────────────────┐
│      Next.js Server Actions           │
│  ┌─────────────┐   ┌──────────────┐  │
│  │   Mem0      │   │   Convex     │  │
│  │  (Memory)   │   │ (Structured) │  │
│  └─────────────┘   └──────────────┘  │
└───────────────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────┐
│     Claude/OpenAI (LLM)               │
└───────────────────────────────────────┘
```

**What Goes Where**:
- **Convex**: Sellers, lessons, opportunities, completions (existing data)
- **Mem0**: User preferences, conversation context, learned patterns
- **LLM**: Claude for chat responses

**Implementation**:
```typescript
// app/actions/hybrid-chat.ts
import { MemoryClient } from 'mem0ai';
import { api } from '@/convex/_generated/api';
import { fetchMutation, fetchQuery } from 'convex/nextjs';
import Anthropic from '@anthropic-ai/sdk';

const mem0 = new MemoryClient(process.env.MEM0_API_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function hybridChat(sellerId: string, message: string) {
  // 1. Get structured data from Convex
  const seller = await fetchQuery(api.sellers.publicSeller, { sellerId });
  const completions = await fetchQuery(api.courses.getSellerCompletions, { sellerId });
  const recentOpps = await fetchQuery(api.opportunities.listLatest, {});

  // 2. Get memories from Mem0
  const memories = await mem0.search(message, { user_id: sellerId });

  // 3. Build rich context
  const context = `
Seller Info:
- Handle: ${seller.handle}
- Completed Lessons: ${completions.length}
- Certified: ${seller.isCertified}

User Preferences & History:
${memories.map(m => `- ${m.memory}`).join('\n')}

Available Opportunities:
${recentOpps.slice(0, 3).map(o => `- ${o.title} (${o.source})`).join('\n')}
  `;

  // 4. Chat with Claude
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    system: `You are a helpful sales assistant for SalesRadar. Use the context to provide personalized recommendations.`,
    messages: [
      { role: 'user', content: `${context}\n\nUser: ${message}` }
    ]
  });

  // 5. Save to both systems
  await Promise.all([
    // Save to Convex (structured)
    fetchMutation(api.chat.saveMessage, {
      sellerId,
      role: 'user',
      content: message
    }),

    // Save to Mem0 (memory)
    mem0.add(message, {
      user_id: sellerId,
      metadata: { type: 'user_message' }
    })
  ]);

  return response.content[0].text;
}
```

**Time to Implement**: 4-8 hours

---

## Decision Matrix

Choose based on your needs:

| Requirement | Recommended Solution |
|-------------|---------------------|
| Quick MVP with user memory | **Mem0** (Scenario 1) |
| Complex relationships (sellers ↔ lessons ↔ opps) | **HelixDB** (Scenario 2) |
| Keep existing Convex + add memory | **Mem0 + Convex** (Scenario 3) ✅ |
| Advanced RAG with graph traversal | **HelixDB** (Scenario 2) |
| SOC2/HIPAA compliance required | **Mem0 Platform** |
| Minimal cost (free tier) | **Mem0 OSS** or **HelixDB OSS** |
| Best performance for graph queries | **HelixDB** |
| Easiest integration | **Mem0** |

---

## Recommended Approach for Zeron

**Phase 1**: Start with **Mem0 + Convex** (Scenario 3)
- Keep Convex for structured data (sellers, lessons, opps)
- Add Mem0 for user memory and conversation context
- Minimal changes to existing architecture
- Fast to implement (4-8 hours)

**Phase 2**: Evaluate need for HelixDB
- If you need complex graph queries (e.g., "find opportunities similar to lessons completed by sellers in similar niches")
- If you're building a recommendation engine
- If you want to explore relationships deeply

**Why This Approach**:
1. ✅ Leverages existing Convex investment
2. ✅ Adds powerful memory capabilities quickly
3. ✅ Doesn't require data migration
4. ✅ Can add HelixDB later if needed
5. ✅ Mem0 has proven track record (13M+ downloads)

---

## Code Examples

### Mem0 Quick Start

```typescript
// Install
npm install mem0ai @anthropic-ai/sdk

// Usage
import { MemoryClient } from 'mem0ai';

const mem0 = new MemoryClient(process.env.MEM0_API_KEY);

// Add memory
await mem0.add("User prefers technical opportunities", {
  user_id: "seller_123",
  metadata: { type: "preference" }
});

// Search memories
const memories = await mem0.search("technical jobs", {
  user_id: "seller_123"
});

// Get all user memories
const allMemories = await mem0.getAll({ user_id: "seller_123" });
```

### HelixDB Quick Start

```python
# Install
pip install helix-db

# Usage
from helix_db import HelixDB

db = HelixDB()

# Insert with vector
db.execute("""
  CREATE (s:Seller {
    id: 'seller_123',
    handle: 'johndoe',
    bio: 'Expert in SaaS sales',
    embedding: $embedding
  })
""", {'embedding': generate_embedding('Expert in SaaS sales')})

# Hybrid query
result = db.query("""
  MATCH (s:Seller {id: $seller_id})-[:COMPLETED]->(l:Lesson)
  MATCH (opp:Opportunity)
  WHERE vector_similarity(opp.embedding, l.embedding) > 0.8
  RETURN opp.title, opp.url
  LIMIT 5
""", {'seller_id': 'seller_123'})
```

### Calling from Convex Actions

Both Mem0 and HelixDB can be called from Convex actions using `fetch`:

```typescript
// convex/chat.ts
import { action } from "./_generated/server";
import { v } from "convex/values";

// Example: Call Mem0 from Convex action
export const chatWithMemory = action({
  args: { sellerId: v.string(), message: v.string() },
  handler: async (ctx, args) => {
    // 1. Get seller data from Convex
    const seller = await ctx.runQuery(api.sellers.publicSeller, {
      sellerId: args.sellerId
    });

    // 2. Call Mem0 API to get user memories
    const memoryResponse = await fetch('https://api.mem0.ai/v1/memories/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MEM0_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: args.message,
        user_id: args.sellerId
      })
    });
    const memories = await memoryResponse.json();

    // 3. Or call HelixDB REST API
    const helixResponse = await fetch('http://localhost:6969/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          MATCH (s:Seller {id: $seller_id})-[:COMPLETED]->(l:Lesson)
          RETURN l.title
        `,
        params: { seller_id: args.sellerId }
      })
    });
    const knowledge = await helixResponse.json();

    // 4. Combine Convex data + Mem0/HelixDB knowledge + call LLM
    const context = `
      Seller: ${seller.handle}
      Memories: ${JSON.stringify(memories)}
      Knowledge: ${JSON.stringify(knowledge)}
    `;

    // 5. Call Claude/OpenAI with combined context
    const llmResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{ role: 'user', content: context + '\n\n' + args.message }]
      })
    });

    return await llmResponse.json();
  }
});
```

**Key Point**: Convex actions can call external APIs (Mem0, HelixDB, Claude, etc.) while Convex mutations/queries handle your Convex database. This keeps your stack clean and leverages the strengths of each service.

---

## Cost Comparison

### Mem0
- **Open Source**: Free (self-hosted)
- **Platform**:
  - Starter: ~$20-50/month
  - Pro: ~$100-200/month
  - Enterprise: Custom

### HelixDB
- **Open Source**: Free (self-hosted)
- **Managed Cloud**: Pricing TBD (currently waitlist)
- **Infrastructure**: Minimal (single database)

### Total Cost Estimate (Phase 1)

**Mem0 + Convex Approach**:
- Convex: $25/month (current)
- Mem0 Platform: $20-50/month
- Claude API: ~$50/month (estimated for 10k messages)
- **Total**: ~$95-125/month

**Or use Mem0 OSS (free)**:
- Convex: $25/month
- Mem0: $0 (self-hosted)
- Vector DB (Qdrant Cloud): $25/month
- Claude API: ~$50/month
- **Total**: ~$100/month

---

## Next Steps

1. **Decide on approach** (Recommended: Scenario 3 - Mem0 + Convex)

2. **Set up environment**:
   ```bash
   cd app
   npm install mem0ai @anthropic-ai/sdk
   ```

3. **Add environment variables**:
   ```env
   MEM0_API_KEY=your_key
   ANTHROPIC_API_KEY=your_key
   ```

4. **Implement basic chat** (see code examples above)

5. **Test with sellers** and gather feedback

6. **Iterate** based on needs

---

## Resources

### Mem0
- Docs: https://docs.mem0.ai/introduction
- GitHub: https://github.com/mem0ai/mem0
- Platform: https://mem0.ai

### HelixDB
- Docs: https://www.helix-db.com/blog
- GitHub: https://github.com/HelixDB/helix-db
- Website: https://www.helix-db.com

### Convex + AI
- Convex AI Guide: https://docs.convex.dev/guides/ai
- Convex Actions: https://docs.convex.dev/actions

---

## Conclusion

For Zeron's use case:
- **Start with Mem0** for quick implementation and proven reliability
- **Keep Convex** for your existing structured data
- **Consider HelixDB later** if you need advanced graph capabilities

The hybrid approach (Mem0 + Convex) gives you the best balance of speed, functionality, and flexibility while minimizing risk and migration complexity.
