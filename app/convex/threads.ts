import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// List user's threads
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) return [];

    const threads = await ctx.db
      .query("threads")
      .withIndex("by_userId_updatedAt", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return threads;
  },
});

// Get single thread
export const get = query({
  args: { id: v.id("threads") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) return null;

    const thread = await ctx.db.get(args.id);
    if (!thread || thread.userId !== user._id) {
      return null;
    }

    return thread;
  },
});

// Create new thread
export const create = mutation({
  args: {
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    let user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    // Create user if doesn't exist
    if (!user) {
      const userId = await ctx.db.insert("users", {
        name: identity.name || "",
        email: identity.email!,
        emailVerified: true,
        image: identity.pictureUrl,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      user = await ctx.db.get(userId);
    }

    const threadId = await ctx.db.insert("threads", {
      userId: user!._id,
      title: args.title,
      status: "ready",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return threadId;
  },
});

// Update thread
export const update = mutation({
  args: {
    id: v.id("threads"),
    title: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("ready"),
        v.literal("streaming"),
        v.literal("submitted")
      )
    ),
    streamId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    const thread = await ctx.db.get(args.id);
    if (!thread || thread.userId !== user._id) {
      throw new Error("Thread not found or unauthorized");
    }

    const { id, ...updates } = args;
    await ctx.db.patch(args.id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

// Delete thread (cascade delete messages)
export const remove = mutation({
  args: { id: v.id("threads") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    const thread = await ctx.db.get(args.id);
    if (!thread || thread.userId !== user._id) {
      throw new Error("Thread not found or unauthorized");
    }

    // Delete all messages in this thread
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.id))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete the thread
    await ctx.db.delete(args.id);
  },
});
