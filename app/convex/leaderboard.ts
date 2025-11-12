import { query } from "./_generated/server";

export const leaderboard = query({
  args: {},
  handler: async (ctx) => {
    // Get all sellers
    const sellers = await ctx.db.query("sellers").collect();

    // Calculate points for each seller
    const leaderboardData = await Promise.all(
      sellers.map(async (seller) => {
        // Count completed lessons (10 points each)
        const completions = await ctx.db
          .query("completions")
          .withIndex("by_seller", (q) => q.eq("sellerId", seller._id))
          .collect();
        const lessonPoints = completions.length * 10;

        // Count opportunity clicks (1 point each)
        const clicks = await ctx.db
          .query("opp_clicks")
          .withIndex("by_seller", (q) => q.eq("sellerId", seller._id))
          .collect();
        const clickPoints = clicks.length;

        const totalPoints = lessonPoints + clickPoints;

        return {
          _id: seller._id,
          handle: seller.handle,
          niches: seller.niches,
          certified: seller.certified,
          lessonsCompleted: completions.length,
          clicks: clicks.length,
          totalPoints,
        };
      })
    );

    // Sort by total points descending
    leaderboardData.sort((a, b) => b.totalPoints - a.totalPoints);

    return leaderboardData;
  },
});
