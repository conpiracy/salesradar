import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List all models (public or user has access to)
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    // If not authenticated, return only public models
    if (!identity) {
      return await ctx.db
        .query("models")
        .withIndex("by_access", (q) => q.eq("access", "public"))
        .collect();
    }

    // If authenticated, check user's access level
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return await ctx.db
        .query("models")
        .withIndex("by_access", (q) => q.eq("access", "public"))
        .collect();
    }

    // Check if user has premium access
    const customer = await ctx.db
      .query("userCustomers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    const hasPremium = customer?.subscription?.status === "active";

    // Return all models if premium, otherwise public + account_required
    const allModels = await ctx.db.query("models").collect();

    return allModels.filter((model) => {
      if (model.access === "public") return true;
      if (model.access === "account_required") return true;
      if (model.access === "premium_required") return hasPremium;
      return false;
    });
  },
});

// Get single model
export const get = query({
  args: { modelId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("models")
      .withIndex("by_modelId", (q) => q.eq("modelId", args.modelId))
      .first();
  },
});

// Seed models (admin function - call once to populate)
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const models = [
      {
        modelId: "gpt-4o",
        name: "GPT-4o",
        model: "gpt-4o",
        description: "OpenAI's most advanced multimodal model",
        capabilities: ["tools", "vision"],
        icon: "openai" as const,
        credits: 10,
        access: "account_required" as const,
      },
      {
        modelId: "gpt-4o-mini",
        name: "GPT-4o Mini",
        model: "gpt-4o-mini",
        description: "Fast and affordable GPT-4o variant",
        capabilities: ["tools", "vision"],
        icon: "openai" as const,
        credits: 1,
        access: "public" as const,
      },
      {
        modelId: "claude-4-sonnet",
        name: "Claude 4 Sonnet",
        model: "claude-sonnet-4-20250514",
        description: "Anthropic's balanced model",
        capabilities: ["tools", "vision"],
        icon: "claude" as const,
        credits: 10,
        access: "account_required" as const,
      },
      {
        modelId: "claude-4.5-sonnet",
        name: "Claude 4.5 Sonnet",
        model: "claude-sonnet-4-5-20250929",
        description: "Anthropic's most capable model",
        capabilities: ["tools", "vision"],
        icon: "claude" as const,
        credits: 15,
        access: "premium_required" as const,
      },
      {
        modelId: "gemini-2.5-flash",
        name: "Gemini 2.5 Flash",
        model: "gemini-2.5-flash",
        description: "Google's fast multimodal model",
        capabilities: ["tools", "vision"],
        icon: "google" as const,
        credits: 5,
        access: "public" as const,
      },
    ];

    const results = [];
    for (const model of models) {
      const existing = await ctx.db
        .query("models")
        .withIndex("by_modelId", (q) => q.eq("modelId", model.modelId))
        .first();

      if (!existing) {
        const id = await ctx.db.insert("models", {
          ...model,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        results.push(id);
      }
    }

    return results;
  },
});
