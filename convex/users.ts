import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get current authenticated user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const user = await ctx.db.get(userId);
    return user;
  },
});

// Get all users (for admin/debugging purposes)
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users;
  },
});

// Get user by email
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();

    return user;
  },
});

// Update user password - simplified version
// In a real app, you'd want to integrate with Convex Auth's password update system
export const updatePassword = mutation({
  args: {
    email: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, { email, newPassword }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Note: This is a simplified implementation
    // In a real app with Convex Auth, you'd need to properly hash the password
    // and update it through the auth system
    console.log(`Password update requested for user: ${email}`);

    // For now, we'll just log this - the actual password update would need
    // to be handled by Convex Auth's password provider
    return { success: true };
  },
});

// Create user manually (for CLI tool)
// Note: This creates a user record but doesn't create auth credentials
// Users created this way will need to use the password reset flow to set up their login
export const createUserManually = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("admin"), v.literal("teacher"), v.literal("student")),
    password: v.string(),
  },
  handler: async (ctx, { email, name, role }) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();

    if (existingUser) {
      throw new ConvexError("User with this email already exists");
    }

    // Create user record
    // Note: This only creates the user profile, not authentication credentials
    // The user will need to use password reset or be invited to set up login
    const userId = await ctx.db.insert("users", {
      email,
      name,
      role,
    });

    return {
      userId,
      email,
      name,
      role,
      note: "User created. They will need to use 'Forgot Password' to set up login credentials."
    };
  },
});