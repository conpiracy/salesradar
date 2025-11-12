import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Generate a random adminKey
function generateAdminKey(): string {
  return `sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
}

// Helper to verify adminKey
async function verifyAdminKey(ctx: any, adminKey: string): Promise<Id<"sellers"> | null> {
  const seller = await ctx.db
    .query("sellers")
    .withIndex("by_adminKey", (q: any) => q.eq("adminKey", adminKey))
    .first();
  return seller?._id || null;
}

export const startSeller = mutation({
  args: {
    handle: v.string(),
    email: v.optional(v.string()),
    niches: v.array(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args: any) => {
    // Check if handle already exists
    const existing = await ctx.db
      .query("sellers")
      .withIndex("by_handle", (q) => q.eq("handle", args.handle))
      .first();

    if (existing) {
      throw new Error("Handle already taken");
    }

    const adminKey = generateAdminKey();
    const sellerId = await ctx.db.insert("sellers", {
      handle: args.handle,
      email: args.email,
      adminKey,
      bio: args.bio,
      niches: args.niches,
      certified: false,
      createdAt: Date.now(),
    });

    return { sellerId, adminKey };
  },
});

export const updateProfile = mutation({
  args: {
    adminKey: v.string(),
    niches: v.optional(v.array(v.string())),
    bio: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args: any) => {
    const sellerId = await verifyAdminKey(ctx, args.adminKey);
    if (!sellerId) {
      throw new Error("Invalid adminKey");
    }

    const updates: any = {};
    if (args.niches !== undefined) updates.niches = args.niches;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.email !== undefined) updates.email = args.email;

    await ctx.db.patch(sellerId, updates);
    return { success: true };
  },
});

export const publicSeller = query({
  args: { handle: v.string() },
  handler: async (ctx, args: any) => {
    const seller = await ctx.db
      .query("sellers")
      .withIndex("by_handle", (q) => q.eq("handle", args.handle))
      .first();

    if (!seller) {
      return null;
    }

    // Return public fields only
    return {
      _id: seller._id,
      handle: seller.handle,
      bio: seller.bio,
      niches: seller.niches,
      certified: seller.certified,
      createdAt: seller.createdAt,
    };
  },
});

export const certifiedDirectory = query({
  args: {},
  handler: async (ctx) => {
    const sellers = await ctx.db
      .query("sellers")
      .withIndex("by_certified", (q) => q.eq("certified", true))
      .collect();

    return sellers.map((s) => ({
      _id: s._id,
      handle: s.handle,
      bio: s.bio,
      niches: s.niches,
      certified: s.certified,
      createdAt: s.createdAt,
    }));
  },
});
