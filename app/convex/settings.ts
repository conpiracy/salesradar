import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get user settings
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

    const settings = await ctx.db
      .query("settings")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    return settings;
  },
});

// Initialize or get settings
export const getOrCreate = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    let user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

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

    let settings = await ctx.db
      .query("settings")
      .withIndex("by_userId", (q) => q.eq("userId", user!._id))
      .first();

    if (!settings) {
      const settingsId = await ctx.db.insert("settings", {
        userId: user!._id,
        mode: "dark",
        modelId: "gpt-4o-mini",
        pinnedModels: [
          "claude-4-sonnet",
          "gpt-4o",
          "gpt-4o-mini",
          "gemini-2.5-flash",
        ],
      });
      settings = await ctx.db.get(settingsId);
    }

    return settings;
  },
});

// Update settings
export const update = mutation({
  args: {
    mode: v.optional(v.union(v.literal("light"), v.literal("dark"))),
    theme: v.optional(v.string()),
    nickname: v.optional(v.string()),
    biography: v.optional(v.string()),
    instructions: v.optional(v.string()),
    modelId: v.optional(v.string()),
    pinnedModels: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    let settings = await ctx.db
      .query("settings")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (!settings) {
      // Create if doesn't exist
      const settingsId = await ctx.db.insert("settings", {
        userId: user._id,
        mode: args.mode || "dark",
        theme: args.theme,
        nickname: args.nickname,
        biography: args.biography,
        instructions: args.instructions,
        modelId: args.modelId || "gpt-4o-mini",
        pinnedModels: args.pinnedModels || [],
      });
      return settingsId;
    }

    // Update existing
    await ctx.db.patch(settings._id, args);
    return settings._id;
  },
});
