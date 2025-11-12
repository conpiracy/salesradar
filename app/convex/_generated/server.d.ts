/* eslint-disable */
/**
 * Generated utilities for implementing server-side Convex query and mutation functions.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  GenericMutationCtx,
  GenericQueryCtx,
  GenericActionCtx,
} from "convex/server";
import type { DataModel } from "./dataModel.js";

/**
 * Define functions that query the database or throw an error.
 *
 * This differs from the type in `convex/server` which declares functions that
 * are not async. This type is for the functions exported from your Convex
 * modules, which must be async.
 *
 * @public
 */
export declare const query: {
  <Args extends Record<string, any> = {}, Output = any>(
    func: (ctx: GenericQueryCtx<DataModel>, args: Args) => Promise<Output>
  ): {
    (ctx: GenericQueryCtx<DataModel>, args: Args): Promise<Output>;
    isQuery: true;
    isAction: false;
    isMutation: false;
  };
  <Args extends Record<string, any> = {}, Output = any>(
    options: { args?: any; handler: (ctx: GenericQueryCtx<DataModel>, args: Args) => Promise<Output> }
  ): {
    (ctx: GenericQueryCtx<DataModel>, args: Args): Promise<Output>;
    isQuery: true;
    isAction: false;
    isMutation: false;
  };
};

/**
 * Define functions that can read and write to the database or throw an error.
 *
 * This differs from the type in `convex/server` which declares functions that
 * are not async. This type is for the functions exported from your Convex
 * modules, which must be async.
 *
 * @public
 */
export declare const mutation: {
  <Args extends Record<string, any> = {}, Output = any>(
    func: (ctx: GenericMutationCtx<DataModel>, args: Args) => Promise<Output>
  ): {
    (ctx: GenericMutationCtx<DataModel>, args: Args): Promise<Output>;
    isQuery: false;
    isAction: false;
    isMutation: true;
  };
  <Args extends Record<string, any> = {}, Output = any>(
    options: { args?: any; handler: (ctx: GenericMutationCtx<DataModel>, args: Args) => Promise<Output> }
  ): {
    (ctx: GenericMutationCtx<DataModel>, args: Args): Promise<Output>;
    isQuery: false;
    isAction: false;
    isMutation: true;
  };
};

/**
 * Define functions that can run third party code or throw an error.
 *
 * This differs from the type in `convex/server` which declares functions that
 * are not async. This type is for the functions exported from your Convex
 * modules, which must be async.
 *
 * @public
 */
export declare const action: {
  <Args extends Record<string, any> = {}, Output = any>(
    func: (ctx: GenericActionCtx<DataModel>, args: Args) => Promise<Output>
  ): {
    (ctx: GenericActionCtx<DataModel>, args: Args): Promise<Output>;
    isQuery: false;
    isAction: true;
    isMutation: false;
  };
  <Args extends Record<string, any> = {}, Output = any>(
    options: { args?: any; handler: (ctx: GenericActionCtx<DataModel>, args: Args) => Promise<Output> }
  ): {
    (ctx: GenericActionCtx<DataModel>, args: Args): Promise<Output>;
    isQuery: false;
    isAction: true;
    isMutation: false;
  };
};
