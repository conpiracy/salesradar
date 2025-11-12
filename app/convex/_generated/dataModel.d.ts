/* eslint-disable */
/**
 * Generated data model types.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  DataModelFromSchemaDefinition,
} from "convex/server";
import type { GenericId } from "convex/values";
import schema from "../schema.js";

/**
 * The names of all of your Convex tables.
 */
export type TableNames = "sellers" | "lessons" | "completions" | "opportunities" | "opp_clicks";

/**
 * The type of a document stored in Convex.
 */
export type Doc<TableName extends TableNames> = TableName extends "sellers"
  ? {
      _id: GenericId<"sellers">;
      _creationTime: number;
      handle: string;
      email?: string;
      adminKey: string;
      bio?: string;
      niches: string[];
      certified: boolean;
      createdAt: number;
    }
  : TableName extends "lessons"
  ? {
      _id: GenericId<"lessons">;
      _creationTime: number;
      slug: string;
      title: string;
      order: number;
      content: string;
    }
  : TableName extends "completions"
  ? {
      _id: GenericId<"completions">;
      _creationTime: number;
      sellerId: GenericId<"sellers">;
      lessonId: GenericId<"lessons">;
      completedAt: number;
    }
  : TableName extends "opportunities"
  ? {
      _id: GenericId<"opportunities">;
      _creationTime: number;
      source: string;
      url: string;
      title: string;
      postedAt: number;
      meta?: any;
    }
  : TableName extends "opp_clicks"
  ? {
      _id: GenericId<"opp_clicks">;
      _creationTime: number;
      sellerId?: GenericId<"sellers">;
      opportunityId: GenericId<"opportunities">;
      ts: number;
    }
  : never;

export type Id<TableName extends TableNames> = GenericId<TableName>;

/**
 * A type describing your Convex data model.
 */
export type DataModel = DataModelFromSchemaDefinition<typeof schema>;
