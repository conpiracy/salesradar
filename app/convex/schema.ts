import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  sellers: defineTable({
    handle: v.string(),
    email: v.optional(v.string()),
    adminKey: v.string(),
    bio: v.optional(v.string()),
    niches: v.array(v.string()),
    certified: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_handle", ["handle"])
    .index("by_adminKey", ["adminKey"])
    .index("by_certified", ["certified"]),

  lessons: defineTable({
    slug: v.string(),
    title: v.string(),
    order: v.number(),
    content: v.string(),
  })
    .index("by_slug", ["slug"])
    .index("by_order", ["order"]),

  completions: defineTable({
    sellerId: v.id("sellers"),
    lessonId: v.id("lessons"),
    completedAt: v.number(),
  })
    .index("by_seller", ["sellerId"])
    .index("by_lesson", ["lessonId"])
    .index("by_seller_lesson", ["sellerId", "lessonId"]),

  opportunities: defineTable({
    source: v.string(),
    url: v.string(),
    title: v.string(),
    postedAt: v.number(),
    meta: v.optional(v.any()),
  })
    .index("by_source", ["source"])
    .index("by_postedAt", ["postedAt"]),

  opp_clicks: defineTable({
    sellerId: v.optional(v.id("sellers")),
    opportunityId: v.id("opportunities"),
    ts: v.number(),
  })
    .index("by_opportunity", ["opportunityId"])
    .index("by_seller", ["sellerId"]),
});
