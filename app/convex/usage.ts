import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get user usage
export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) return null;

    let usage = await ctx.db
      .query("usage")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    // Create if doesn't exist
    if (!usage) {
      const usageId = await ctx.db.insert("usage", {
        userId: user._id,
        credits: 100, // Free tier gets 100 credits
        search: 10,
        research: 5,
      });
      usage = await ctx.db.get(usageId);
    }

    return usage;
  },
});

// Deduct credits
export const deductCredits = mutation({
  args: {
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    let usage = await ctx.db
      .query("usage")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (!usage) {
      throw new Error("Usage record not found");
    }

    if (usage.credits < args.amount) {
      throw new Error("Insufficient credits");
    }

    await ctx.db.patch(usage._id, {
      credits: usage.credits - args.amount,
    });

    return usage.credits - args.amount;
  },
});

// Add credits (for purchases/refills)
export const addCredits = mutation({
  args: {
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    let usage = await ctx.db
      .query("usage")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (!usage) {
      const usageId = await ctx.db.insert("usage", {
        userId: user._id,
        credits: args.amount,
        search: 10,
        research: 5,
      });
      return args.amount;
    }

    await ctx.db.patch(usage._id, {
      credits: usage.credits + args.amount,
    });

    return usage.credits + args.amount;
  },
});

// Deduct search usage
export const deductSearch = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    const usage = await ctx.db
      .query("usage")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (!usage || usage.search <= 0) {
      throw new Error("No search credits remaining");
    }

    await ctx.db.patch(usage._id, {
      search: usage.search - 1,
    });

    return usage.search - 1;
  },
});

// Deduct research usage
export const deductResearch = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    const usage = await ctx.db
      .query("usage")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (!usage || usage.research <= 0) {
      throw new Error("No research credits remaining");
    }

    await ctx.db.patch(usage._id, {
      research: usage.research - 1,
    });

    return usage.research - 1;
  },
});

// ========== SERVER-SIDE FUNCTIONS (for API routes) ==========

// Deduct credits by user ID (server-side)
export const deductCreditsByUserId = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const usage = await ctx.db
      .query("usage")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!usage) {
      throw new Error("Usage record not found");
    }

    if (usage.credits < args.amount) {
      throw new Error("Insufficient credits");
    }

    await ctx.db.patch(usage._id, {
      credits: usage.credits - args.amount,
    });

    return usage.credits - args.amount;
  },
});

// Add credits by user ID (server-side)
export const addCreditsByUserId = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const usage = await ctx.db
      .query("usage")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!usage) {
      // Create usage record if doesn't exist
      await ctx.db.insert("usage", {
        userId: args.userId,
        credits: args.amount,
        search: 10,
        research: 5,
      });
      return args.amount;
    }

    await ctx.db.patch(usage._id, {
      credits: usage.credits + args.amount,
    });

    return usage.credits + args.amount;
  },
});
