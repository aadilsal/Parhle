/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as chatMessages from "../chatMessages.js";
import type * as embeddings from "../embeddings.js";
import type * as fileStorage from "../fileStorage.js";
import type * as langchain_db from "../langchain/db.js";
import type * as myActions from "../myActions.js";
import type * as pdfFiles from "../pdfFiles.js";
import type * as queries from "../queries.js";
import type * as user from "../user.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  chatMessages: typeof chatMessages;
  embeddings: typeof embeddings;
  fileStorage: typeof fileStorage;
  "langchain/db": typeof langchain_db;
  myActions: typeof myActions;
  pdfFiles: typeof pdfFiles;
  queries: typeof queries;
  user: typeof user;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
