import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const ingestBatch = mutation({
  args: {
    source: v.string(),
    items: v.array(
      v.object({
        url: v.string(),
        title: v.string(),
        postedAt: v.number(),
        meta: v.optional(v.any()),
      })
    ),
  },
  handler: async (ctx, args: any) => {
    const results = [];
    for (const item of args.items) {
      // Check if URL already exists to avoid duplicates
      const existing = await ctx.db
        .query("opportunities")
        .filter((q) => q.eq(q.field("url"), item.url))
        .first();

      if (!existing) {
        const id = await ctx.db.insert("opportunities", {
          source: args.source,
          url: item.url,
          title: item.title,
          postedAt: item.postedAt,
          meta: item.meta,
        });
        results.push(id);
      }
    }
    return results;
  },
});

export const listLatest = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args: any) => {
    const limit = args.limit || 20;
    const opps = await ctx.db
      .query("opportunities")
      .withIndex("by_postedAt")
      .order("desc")
      .take(limit);
    return opps;
  },
});

export const recordClick = mutation({
  args: {
    opportunityId: v.id("opportunities"),
    sellerHandle: v.optional(v.string()),
  },
  handler: async (ctx, args: any) => {
    let sellerId = undefined;

    if (args.sellerHandle) {
      const seller = await ctx.db
        .query("sellers")
        .withIndex("by_handle", (q) => q.eq("handle", args.sellerHandle))
        .first();
      sellerId = seller?._id;
    }

    await ctx.db.insert("opp_clicks", {
      sellerId,
      opportunityId: args.opportunityId,
      ts: Date.now(),
    });

    return { success: true };
  },
});
