import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { Resend } from "resend";
import { api } from "./_generated/api";
import { requireAdmin, requireTeacher, canInviteRole, getInvitableRoles, VALID_ROLES } from "./authorization";
import { getAuthUserId } from "@convex-dev/auth/server";

// Store for invite tokens
export const createInviteToken = mutation({
  args: {
    email: v.string(),
    expiresAt: v.number(),
    role: v.union(v.literal("admin"), v.literal("teacher"), v.literal("student")),
  },
  handler: async (ctx, { email, expiresAt, role }) => {
    // Check if current user can invite this role
    const canInvite = await canInviteRole(ctx, role);
    if (!canInvite) {
      throw new ConvexError("You don't have permission to invite this role");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    // Generate a secure token
    const token = crypto.randomUUID();

    // Store the invite token
    await ctx.db.insert("inviteTokens", {
      email,
      token,
      expiresAt,
      createdBy: identity.subject,
      used: false,
      role,
    });

    return token;
  },
});

// Validate invite token
export const validateInviteToken = query({
  args: {
    email: v.string(),
    token: v.string(),
  },
  handler: async (ctx, { email, token }) => {
    const invite = await ctx.db
      .query("inviteTokens")
      .withIndex("by_email_token", (q) =>
        q.eq("email", email).eq("token", token)
      )
      .first();

    if (!invite) {
      throw new ConvexError("Invalid invite token");
    }

    if (invite.used) {
      throw new ConvexError("Invite token has already been used");
    }

    if (Date.now() > invite.expiresAt) {
      throw new ConvexError("Invite token has expired");
    }

    return true;
  },
});

// Mark invite token as used
export const markInviteTokenUsed = mutation({
  args: {
    email: v.string(),
    token: v.string(),
  },
  handler: async (ctx, { email, token }) => {
    const invite = await ctx.db
      .query("inviteTokens")
      .withIndex("by_email_token", (q) =>
        q.eq("email", email).eq("token", token)
      )
      .first();

    if (!invite) {
      throw new ConvexError("Invalid invite token");
    }

    await ctx.db.patch(invite._id, { used: true });
  },
});

// Send invite email
export const sendInviteEmail = action({
  args: {
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("teacher"), v.literal("student")),
  },
  handler: async (ctx, { email, role }) => {
    // Role-based permissions are checked in createInviteToken

    // Create invite token (expires in 7 days)
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const token = await ctx.runMutation(api.invites.createInviteToken, {
      email,
      expiresAt,
      role
    });

    // Get app domain from environment
    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "http://localhost:3000";
    const inviteUrl = `${appDomain}/invite?email=${encodeURIComponent(email)}&token=${token}`;

    // Send email using Resend
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);

      console.log("Sending email from:", process.env.FROM_EMAIL, "to:", email);
      console.log("Invite URL:", inviteUrl);

      const { data, error } = await resend.emails.send({
        from: process.env.FROM_EMAIL!,
        to: [email],
        subject: "You're invited to join! 🎮 - U&I Game Platform",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; overflow: hidden;">
            <div style="background: white; margin: 2px; border-radius: 10px; padding: 40px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #4f46e5; font-size: 28px; margin: 0; font-weight: bold;">🎮 U&I Game Platform</h1>
                <p style="color: #6b7280; font-size: 16px; margin: 10px 0 0 0;">Educational Gaming Made Fun</p>
              </div>

              <div style="background: #f8fafc; padding: 30px; border-radius: 8px; border-left: 4px solid #4f46e5;">
                <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px;">You've been invited! 🚀</h2>
                <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">Hello there!</p>
                <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
                  You've been invited to join <strong>U&I Game Platform</strong> - where learning meets fun!
                  Our educational gaming platform makes math and learning engaging through interactive games and challenges.
                </p>
                <p style="color: #374151; line-height: 1.6; margin: 0;">
                  Click the button below to create your account and start your educational gaming journey:
                </p>
              </div>

              <div style="text-align: center; margin: 40px 0;">
                <a href="${inviteUrl}"
                   style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
                  🎯 Create My Account
                </a>
              </div>

              <div style="background: #fef3c7; padding: 20px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 30px 0;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  ⏰ <strong>Important:</strong> This invitation will expire in 7 days for security reasons.
                </p>
              </div>

              <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                  If you didn't expect this invitation, you can safely ignore this email.
                </p>
                <p style="color: #374151; margin: 0; font-weight: 500;">
                  Happy Gaming!<br>
                  <span style="color: #4f46e5;">The U&I Game Platform Team</span>
                </p>
              </div>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error("Resend API error:", error);
        throw new ConvexError(`Email sending failed: ${error.message}`);
      }

      console.log("Email sent successfully:", data);
      return { success: true, message: "Invite sent successfully" };
    } catch (error: any) {
      console.error("Failed to send invite email:", error);
      throw new ConvexError(`Failed to send invite email: ${error.message}`);
    }
  },
});

// Send password reset email
export const sendPasswordResetEmail = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    // Check if user exists (don't reveal if they don't exist for security)
    const user = await ctx.runQuery(api.users.getByEmail, { email });

    if (!user) {
      // Don't reveal if user doesn't exist - return success anyway for security
      return { success: true, message: "Password reset email sent if account exists" };
    }

    // Create password reset token (expires in 1 hour)
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
    const token = crypto.randomUUID();

    // Store the password reset token
    await ctx.runMutation(api.invites.createPasswordResetToken, {
      email,
      token,
      expiresAt,
    });

    // Get app domain from environment
    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "http://localhost:3000";
    const resetUrl = `${appDomain}/reset-password?email=${encodeURIComponent(email)}&token=${token}`;

    // Send email using Resend
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);

      console.log("Sending password reset email from:", process.env.FROM_EMAIL, "to:", email);
      console.log("Reset URL:", resetUrl);

      const { data, error } = await resend.emails.send({
        from: process.env.FROM_EMAIL!,
        to: [email],
        subject: "Reset your password 🔒 - U&I Game Platform",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; overflow: hidden;">
            <div style="background: white; margin: 2px; border-radius: 10px; padding: 40px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #4f46e5; font-size: 28px; margin: 0; font-weight: bold;">🎮 U&I Game Platform</h1>
                <p style="color: #6b7280; font-size: 16px; margin: 10px 0 0 0;">Educational Gaming Made Fun</p>
              </div>

              <div style="background: #fef2f2; padding: 30px; border-radius: 8px; border-left: 4px solid #dc2626;">
                <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px;">🔐 Reset Your Password</h2>
                <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">Hello there!</p>
                <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
                  You requested to reset your password for your <strong>U&I Game Platform</strong> account.
                </p>
                <p style="color: #374151; line-height: 1.6; margin: 0;">
                  Click the button below to set a new password and get back to gaming:
                </p>
              </div>

              <div style="text-align: center; margin: 40px 0;">
                <a href="${resetUrl}"
                   style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">
                  🔑 Reset My Password
                </a>
              </div>

              <div style="background: #fef3c7; padding: 20px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 30px 0;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  ⏰ <strong>Important:</strong> This password reset link will expire in 1 hour for security reasons.
                </p>
              </div>

              <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                  If you didn't request this password reset, you can safely ignore this email.
                </p>
                <p style="color: #374151; margin: 0; font-weight: 500;">
                  Stay secure!<br>
                  <span style="color: #4f46e5;">The U&I Game Platform Team</span>
                </p>
              </div>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error("Resend API error:", error);
        throw new ConvexError(`Email sending failed: ${error.message}`);
      }

      console.log("Password reset email sent successfully:", data);
      return { success: true, message: "Password reset email sent if account exists" };
    } catch (error: any) {
      console.error("Failed to send password reset email:", error);
      throw new ConvexError(`Failed to send password reset email: ${error.message}`);
    }
  },
});

// Create password reset token
export const createPasswordResetToken = mutation({
  args: {
    email: v.string(),
    token: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, { email, token, expiresAt }) => {
    // Remove any existing unused tokens for this email
    const existingTokens = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_email_token", (q) => q.eq("email", email))
      .collect();

    for (const existingToken of existingTokens) {
      if (!existingToken.used) {
        await ctx.db.delete(existingToken._id);
      }
    }

    // Create new token
    await ctx.db.insert("passwordResetTokens", {
      email,
      token,
      expiresAt,
      used: false,
    });

    return token;
  },
});

// Validate password reset token
export const validatePasswordResetToken = query({
  args: {
    email: v.string(),
    token: v.string(),
  },
  handler: async (ctx, { email, token }) => {
    const resetToken = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_email_token", (q) =>
        q.eq("email", email).eq("token", token)
      )
      .first();

    if (!resetToken) {
      throw new ConvexError("Invalid reset token");
    }

    if (resetToken.used) {
      throw new ConvexError("Reset token has already been used");
    }

    if (Date.now() > resetToken.expiresAt) {
      throw new ConvexError("Reset token has expired");
    }

    return true;
  },
});

// Reset password
export const resetPassword = action({
  args: {
    email: v.string(),
    token: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, { email, token, newPassword }) => {
    // Validate the reset token
    await ctx.runQuery(api.invites.validatePasswordResetToken, { email, token });

    // Mark token as used
    await ctx.runMutation(api.invites.markPasswordResetTokenUsed, { email, token });

    // Update user's password (this would typically involve hashing)
    await ctx.runMutation(api.users.updatePassword, { email, newPassword });

    return { success: true, message: "Password reset successfully" };
  },
});

// Mark password reset token as used
export const markPasswordResetTokenUsed = mutation({
  args: {
    email: v.string(),
    token: v.string(),
  },
  handler: async (ctx, { email, token }) => {
    const resetToken = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_email_token", (q) =>
        q.eq("email", email).eq("token", token)
      )
      .first();

    if (!resetToken) {
      throw new ConvexError("Invalid reset token");
    }

    await ctx.db.patch(resetToken._id, { used: true });
  },
});

// Assign role to user after signup based on invite token
// This version is more lenient and will retry if authentication is not ready
export const assignRoleFromInvite = mutation({
  args: {
    email: v.string(),
    token: v.string(),
  },
  handler: async (ctx, { email, token }) => {
    // Get the current authenticated user (the new user who just signed up)
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      // If not authenticated yet, just return - will be retried
      return { role: VALID_ROLES.STUDENT, success: false, reason: "Not authenticated yet" };
    }

    // Find the user by email to make sure we're updating the right user
    const userByEmail = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();

    if (!userByEmail) {
      return { role: VALID_ROLES.STUDENT, success: false, reason: "User not found by email" };
    }

    // Verify that the authenticated user matches the email (security check)
    if (userByEmail._id !== userId) {
      return { role: VALID_ROLES.STUDENT, success: false, reason: "User mismatch - security check failed" };
    }

    // Look for the invite token to get the role
    const invite = await ctx.db
      .query("inviteTokens")
      .withIndex("by_email_token", (q) => q.eq("email", email).eq("token", token))
      .first();

    if (invite && invite.role) {
      // Update the user with the role from the invite
      await ctx.db.patch(userId, {
        role: invite.role,
      });

      return { role: invite.role, success: true, reason: "Role assigned" };
    }

    return { role: VALID_ROLES.STUDENT, success: false, reason: "No valid invite found" };
  },
});

// Bootstrap function to create initial admin invite (no auth required)
// This should only be used once to create the first admin
export const createBootstrapInvite = mutation({
  args: {
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("teacher"), v.literal("student")),
  },
  handler: async (ctx, { email, role }) => {
    // Check if any admin users already exist
    const existingAdmin = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    if (existingAdmin) {
      throw new ConvexError("Admin user already exists. Use regular invite flow.");
    }

    // Generate a secure token
    const token = crypto.randomUUID();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    // Store the invite token
    await ctx.db.insert("inviteTokens", {
      email,
      token,
      expiresAt,
      createdBy: "bootstrap", // Special marker for bootstrap creation
      used: false,
      role,
    });

    return { token, email, role };
  },
});

// Get roles that the current user can invite
export const getMyInvitableRoles = query({
  args: {},
  handler: async (ctx) => {
    return await getInvitableRoles(ctx);
  },
});

