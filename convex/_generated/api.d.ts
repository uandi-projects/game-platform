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
import type * as authorization from "../authorization.js";
import type * as gameTypes_ai_mcq_quiz from "../gameTypes/ai_mcq_quiz.js";
import type * as gameTypes_custom_math_quiz from "../gameTypes/custom_math_quiz.js";
import type * as gameTypes_custom_math_race from "../gameTypes/custom_math_race.js";
import type * as gameTypes_multi_player_math from "../gameTypes/multi_player_math.js";
import type * as gameTypes_single_player_math from "../gameTypes/single_player_math.js";
import type * as games from "../games.js";
import type * as http from "../http.js";
import type * as invites from "../invites.js";
import type * as lib_aiMcqPrompt from "../lib/aiMcqPrompt.js";
import type * as lib_openrouter from "../lib/openrouter.js";
import type * as myFunctions from "../myFunctions.js";
import type * as users from "../users.js";

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
  authorization: typeof authorization;
  "gameTypes/ai_mcq_quiz": typeof gameTypes_ai_mcq_quiz;
  "gameTypes/custom_math_quiz": typeof gameTypes_custom_math_quiz;
  "gameTypes/custom_math_race": typeof gameTypes_custom_math_race;
  "gameTypes/multi_player_math": typeof gameTypes_multi_player_math;
  "gameTypes/single_player_math": typeof gameTypes_single_player_math;
  games: typeof games;
  http: typeof http;
  invites: typeof invites;
  "lib/aiMcqPrompt": typeof lib_aiMcqPrompt;
  "lib/openrouter": typeof lib_openrouter;
  myFunctions: typeof myFunctions;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
