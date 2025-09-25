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
});

export default schema;
