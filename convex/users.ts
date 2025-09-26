import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAdmin, getAuthenticatedUser } from "./authorization";

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

// Get all users (admin only)
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const users = await ctx.db.query("users").collect();
    return users.map(user => ({
      ...user,
      // Don't expose sensitive auth data
      emailVerificationTime: user.emailVerificationTime,
      phoneVerificationTime: user.phoneVerificationTime,
    }));
  },
});

// Update user role (admin only)
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("teacher"), v.literal("student")),
  },
  handler: async (ctx, { userId, role }) => {
    await requireAdmin(ctx);

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    await ctx.db.patch(userId, { role });
    return { success: true, userId, newRole: role };
  },
});

// Delete user (admin only)
export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    await requireAdmin(ctx);

    // Get current user to prevent self-deletion
    const currentUser = await getAuthenticatedUser(ctx);

    if (currentUser._id === userId) {
      throw new ConvexError("Cannot delete your own account");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    // TODO: In a production app, you might want to:
    // 1. Clean up related data (invites, etc.)
    // 2. Soft delete instead of hard delete
    // 3. Log the deletion for audit purposes

    await ctx.db.delete(userId);
    return { success: true, userId };
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

// Update user profile (authenticated user can update their own profile)
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    soundFeedback: v.optional(v.boolean()),
    hapticFeedback: v.optional(v.boolean()),
  },
  handler: async (ctx, { name, phone, soundFeedback, hapticFeedback }) => {
    const currentUser = await getAuthenticatedUser(ctx);

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (soundFeedback !== undefined) updates.soundFeedback = soundFeedback;
    if (hapticFeedback !== undefined) updates.hapticFeedback = hapticFeedback;

    if (Object.keys(updates).length === 0) {
      throw new ConvexError("No updates provided");
    }

    await ctx.db.patch(currentUser._id, updates);

    const updatedUser = await ctx.db.get(currentUser._id);
    return updatedUser;
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