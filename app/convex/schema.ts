import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table (from Better Auth)
  users: defineTable({
    name: v.string(),
    email: v.string(),
    emailVerified: v.boolean(),
    image: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"]),

  sessions: defineTable({
    sessionToken: v.string(),
    userId: v.id("users"),
    expiresAt: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_sessionToken", ["sessionToken"])
    .index("by_userId", ["userId"]),

  accounts: defineTable({
    userId: v.id("users"),
    accountId: v.string(),
    providerId: v.string(),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_accountId", ["accountId"]),

  verifications: defineTable({
    identifier: v.string(),
    value: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_identifier", ["identifier"]),

  // Threads (chat conversations)
  threads: defineTable({
    userId: v.id("users"),
    title: v.optional(v.string()),
    status: v.union(
      v.literal("ready"),
      v.literal("streaming"),
      v.literal("submitted")
    ),
    streamId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_streamId", ["streamId"])
    .index("by_userId_updatedAt", ["userId", "updatedAt"]),

  // Messages in threads
  messages: defineTable({
    threadId: v.id("threads"),
    userId: v.id("users"),
    message: v.any(), // JSONB equivalent - stores ThreadMessage type
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_threadId", ["threadId"])
    .index("by_userId", ["userId"])
    .index("by_threadId_createdAt", ["threadId", "createdAt"]),

  // AI Models
  models: defineTable({
    modelId: v.string(), // e.g., "gpt-4o", "claude-4-sonnet"
    name: v.string(),
    model: v.string(),
    description: v.string(),
    capabilities: v.array(v.string()), // ["tools", "vision", "reasoning"]
    icon: v.union(
      v.literal("anthropic"),
      v.literal("claude"),
      v.literal("deepseek"),
      v.literal("gemini"),
      v.literal("google"),
      v.literal("grok"),
      v.literal("meta"),
      v.literal("mistral"),
      v.literal("ollama"),
      v.literal("openai"),
      v.literal("openrouter"),
      v.literal("x"),
      v.literal("xai"),
      v.literal("moonshot"),
      v.literal("zai"),
      v.literal("qwen")
    ),
    credits: v.number(),
    access: v.union(
      v.literal("public"),
      v.literal("account_required"),
      v.literal("premium_required")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_modelId", ["modelId"])
    .index("by_access", ["access"]),

  // User Settings
  settings: defineTable({
    userId: v.id("users"),
    mode: v.union(v.literal("light"), v.literal("dark")),
    theme: v.optional(v.string()),
    nickname: v.optional(v.string()),
    biography: v.optional(v.string()),
    instructions: v.optional(v.string()),
    modelId: v.string(), // Default model
    pinnedModels: v.array(v.string()),
  })
    .index("by_userId", ["userId"]),

  // Usage tracking
  usage: defineTable({
    userId: v.id("users"),
    credits: v.number(),
    search: v.number(),
    research: v.number(),
  })
    .index("by_userId", ["userId"]),

  // Stripe customers (user subscriptions)
  userCustomers: defineTable({
    userId: v.id("users"),
    customerId: v.string(),
    subscription: v.optional(
      v.object({
        id: v.string(),
        status: v.string(),
        priceId: v.string(),
        currentPeriodEnd: v.number(),
        cancelAtPeriodEnd: v.boolean(),
      })
    ),
  })
    .index("by_userId", ["userId"])
    .index("by_customerId", ["customerId"]),

  // Organizations
  organizations: defineTable({
    name: v.string(),
    slug: v.optional(v.string()),
    logo: v.optional(v.string()),
    createdAt: v.number(),
    metadata: v.optional(v.string()),
  })
    .index("by_slug", ["slug"]),

  members: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    role: v.string(),
    createdAt: v.number(),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_userId", ["userId"])
    .index("by_org_user", ["organizationId", "userId"]),

  invitations: defineTable({
    organizationId: v.id("organizations"),
    email: v.string(),
    role: v.optional(v.string()),
    status: v.string(),
    expiresAt: v.number(),
    inviterId: v.id("users"),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_email", ["email"]),

  // Organization subscriptions
  organizationCustomers: defineTable({
    organizationId: v.id("organizations"),
    customerId: v.string(),
    subscription: v.optional(
      v.object({
        id: v.string(),
        status: v.string(),
        priceId: v.string(),
        currentPeriodEnd: v.number(),
        cancelAtPeriodEnd: v.boolean(),
      })
    ),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_customerId", ["customerId"]),
});
