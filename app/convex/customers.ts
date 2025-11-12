import { query } from "./_generated/server";

// Get user's customer/subscription data
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

    const customer = await ctx.db
      .query("userCustomers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    return customer;
  },
});
