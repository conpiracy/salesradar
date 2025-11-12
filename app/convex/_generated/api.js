/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import { anyApi } from "convex/server";
import { makeFunctionReference } from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
const fullApi = anyApi;
fullApi.sellers = {
  startSeller: makeFunctionReference("sellers:startSeller"),
  updateProfile: makeFunctionReference("sellers:updateProfile"),
  publicSeller: makeFunctionReference("sellers:publicSeller"),
  certifiedDirectory: makeFunctionReference("sellers:certifiedDirectory"),
};
fullApi.courses = {
  seedLessons: makeFunctionReference("courses:seedLessons"),
  listLessons: makeFunctionReference("courses:listLessons"),
  completeLesson: makeFunctionReference("courses:completeLesson"),
  certifyIfEligible: makeFunctionReference("courses:certifyIfEligible"),
  getSellerCompletions: makeFunctionReference("courses:getSellerCompletions"),
};
fullApi.opportunities = {
  ingestBatch: makeFunctionReference("opportunities:ingestBatch"),
  listLatest: makeFunctionReference("opportunities:listLatest"),
  recordClick: makeFunctionReference("opportunities:recordClick"),
};
fullApi.leaderboard = {
  leaderboard: makeFunctionReference("leaderboard:leaderboard"),
};

export const api = fullApi;
export const internal = anyApi;
