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
import type * as auth from "../auth.js";
import type * as functions_billing from "../functions/billing.js";
import type * as functions_certification from "../functions/certification.js";
import type * as functions_community from "../functions/community.js";
import type * as functions_education from "../functions/education.js";
import type * as functions_files from "../functions/files.js";
import type * as functions_mockups from "../functions/mockups.js";
import type * as functions_templates from "../functions/templates.js";
import type * as functions_users from "../functions/users.js";
import type * as functions_whopAnalytics from "../functions/whopAnalytics.js";
import type * as functions_whopIntegration from "../functions/whopIntegration.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "functions/billing": typeof functions_billing;
  "functions/certification": typeof functions_certification;
  "functions/community": typeof functions_community;
  "functions/education": typeof functions_education;
  "functions/files": typeof functions_files;
  "functions/mockups": typeof functions_mockups;
  "functions/templates": typeof functions_templates;
  "functions/users": typeof functions_users;
  "functions/whopAnalytics": typeof functions_whopAnalytics;
  "functions/whopIntegration": typeof functions_whopIntegration;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
