import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const schema = defineSchema({
  ...authTables,
  // Extend the users table with role information
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    role: v.union(v.literal("admin"), v.literal("teacher"), v.literal("student")),
  }).index("email", ["email"]),
  numbers: defineTable({
    value: v.number(),
  }),
  inviteTokens: defineTable({
    email: v.string(),
    token: v.string(),
    expiresAt: v.number(),
    createdBy: v.string(),
    used: v.boolean(),
    role: v.union(v.literal("admin"), v.literal("teacher"), v.literal("student")),
  }).index("by_email_token", ["email", "token"])
    .index("by_email", ["email"]),
  passwordResetTokens: defineTable({
    email: v.string(),
    token: v.string(),
    expiresAt: v.number(),
    used: v.boolean(),
  }).index("by_email_token", ["email", "token"]),
  gameInstances: defineTable({
    code: v.string(),
    gameId: v.string(),
    type: v.union(v.literal("single-player"), v.literal("multiplayer")),
    createdBy: v.id("users"),
    participants: v.array(v.id("users")),
    guestParticipants: v.optional(v.array(v.object({
      name: v.string(),
      joinedAt: v.number(),
    }))),
    creatorParticipating: v.optional(v.boolean()),
    createdAt: v.number(),
    gameStartedAt: v.optional(v.number()), // When the game actually started
    status: v.union(v.literal("waiting"), v.literal("active"), v.literal("completed")),
  }).index("by_code", ["code"])
    .index("by_creator", ["createdBy"])
    .index("by_game_id", ["gameId"]),
  gameProgress: defineTable({
    gameCode: v.string(),
    participantId: v.string(), // userId for auth users, or "guest-name" for guests
    participantName: v.string(),
    participantType: v.union(v.literal("authenticated"), v.literal("guest")),
    questionsAnswered: v.number(),
    totalQuestions: v.number(),
    score: v.number(),
    isActive: v.boolean(), // true if currently playing
    lastUpdated: v.number(),
  }).index("by_game_code", ["gameCode"])
    .index("by_participant", ["gameCode", "participantId"]),
});

export default schema;
