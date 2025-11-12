/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: {
  sellers: {
    startSeller: FunctionReference<"mutation", "public", any, any>;
    updateProfile: FunctionReference<"mutation", "public", any, any>;
    publicSeller: FunctionReference<"query", "public", any, any>;
    certifiedDirectory: FunctionReference<"query", "public", any, any>;
  };
  courses: {
    seedLessons: FunctionReference<"mutation", "public", any, any>;
    listLessons: FunctionReference<"query", "public", any, any>;
    completeLesson: FunctionReference<"mutation", "public", any, any>;
    certifyIfEligible: FunctionReference<"mutation", "public", any, any>;
    getSellerCompletions: FunctionReference<"query", "public", any, any>;
  };
  opportunities: {
    ingestBatch: FunctionReference<"mutation", "public", any, any>;
    listLatest: FunctionReference<"query", "public", any, any>;
    recordClick: FunctionReference<"mutation", "public", any, any>;
  };
  leaderboard: {
    leaderboard: FunctionReference<"query", "public", any, any>;
  };
};

export declare const internal: any;
