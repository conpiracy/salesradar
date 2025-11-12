import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Helper to verify adminKey
async function verifyAdminKey(ctx: any, adminKey: string): Promise<Id<"sellers"> | null> {
  const seller = await ctx.db
    .query("sellers")
    .withIndex("by_adminKey", (q: any) => q.eq("adminKey", adminKey))
    .first();
  return seller?._id || null;
}

export const seedLessons = mutation({
  args: {
    lessons: v.array(
      v.object({
        slug: v.string(),
        title: v.string(),
        order: v.number(),
        content: v.string(),
      })
    ),
  },
  handler: async (ctx, args: any) => {
    const results = [];
    for (const lesson of args.lessons) {
      // Check if lesson already exists
      const existing = await ctx.db
        .query("lessons")
        .withIndex("by_slug", (q) => q.eq("slug", lesson.slug))
        .first();

      if (!existing) {
        const id = await ctx.db.insert("lessons", lesson);
        results.push(id);
      } else {
        results.push(existing._id);
      }
    }
    return results;
  },
});

export const listLessons = query({
  args: {},
  handler: async (ctx) => {
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_order")
      .collect();
    return lessons;
  },
});

export const completeLesson = mutation({
  args: {
    adminKey: v.string(),
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args: any) => {
    const sellerId = await verifyAdminKey(ctx, args.adminKey);
    if (!sellerId) {
      throw new Error("Invalid adminKey");
    }

    // Check if already completed
    const existing = await ctx.db
      .query("completions")
      .withIndex("by_seller_lesson", (q) =>
        q.eq("sellerId", sellerId).eq("lessonId", args.lessonId)
      )
      .first();

    if (existing) {
      return { success: true, alreadyCompleted: true };
    }

    await ctx.db.insert("completions", {
      sellerId,
      lessonId: args.lessonId,
      completedAt: Date.now(),
    });

    return { success: true, alreadyCompleted: false };
  },
});

export const certifyIfEligible = mutation({
  args: {
    adminKey: v.string(),
  },
  handler: async (ctx, args: any) => {
    const sellerId = await verifyAdminKey(ctx, args.adminKey);
    if (!sellerId) {
      throw new Error("Invalid adminKey");
    }

    // Get all lessons
    const allLessons = await ctx.db.query("lessons").collect();

    // Get all completions for this seller
    const completions = await ctx.db
      .query("completions")
      .withIndex("by_seller", (q) => q.eq("sellerId", sellerId))
      .collect();

    // Check if all lessons are completed
    const completedLessonIds = new Set(completions.map((c) => c.lessonId));
    const allComplete = allLessons.every((lesson) =>
      completedLessonIds.has(lesson._id)
    );

    if (allComplete) {
      await ctx.db.patch(sellerId, { certified: true });
      return { certified: true, message: "Congratulations! You are now certified." };
    }

    return {
      certified: false,
      message: `You have completed ${completions.length} of ${allLessons.length} lessons.`,
    };
  },
});

export const getSellerCompletions = query({
  args: {
    adminKey: v.string(),
  },
  handler: async (ctx, args: any) => {
    const sellerId = await verifyAdminKey(ctx, args.adminKey);
    if (!sellerId) {
      return [];
    }

    const completions = await ctx.db
      .query("completions")
      .withIndex("by_seller", (q) => q.eq("sellerId", sellerId))
      .collect();

    return completions.map((c) => c.lessonId);
  },
});
