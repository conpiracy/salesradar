import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List messages in a thread
export const list = query({
  args: { threadId: v.id("threads") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) return [];

    // Verify thread belongs to user
    const thread = await ctx.db.get(args.threadId);
    if (!thread || thread.userId !== user._id) {
      return [];
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_threadId_createdAt", (q) => q.eq("threadId", args.threadId))
      .order("asc")
      .collect();

    return messages;
  },
});

// Create message
export const create = mutation({
  args: {
    threadId: v.id("threads"),
    message: v.any(), // ThreadMessage type
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    // Verify thread belongs to user
    const thread = await ctx.db.get(args.threadId);
    if (!thread || thread.userId !== user._id) {
      throw new Error("Thread not found or unauthorized");
    }

    const messageId = await ctx.db.insert("messages", {
      threadId: args.threadId,
      userId: user._id,
      message: args.message,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update thread's updatedAt
    await ctx.db.patch(args.threadId, {
      updatedAt: Date.now(),
    });

    return messageId;
  },
});

// Update message
export const update = mutation({
  args: {
    id: v.id("messages"),
    message: v.any(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    const message = await ctx.db.get(args.id);
    if (!message || message.userId !== user._id) {
      throw new Error("Message not found or unauthorized");
    }

    await ctx.db.patch(args.id, {
      message: args.message,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});
