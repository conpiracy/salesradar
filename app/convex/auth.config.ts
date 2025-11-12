// Convex authentication configuration
// This file configures Convex to work with Better Auth JWT tokens

export default {
  providers: [
    {
      // Better Auth JWT provider
      domain: process.env.BETTER_AUTH_URL || "http://localhost:5173",
      applicationID: "convex",
    },
  ],
};
