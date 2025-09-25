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
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">

              <!-- Header -->
              <div style="background: #ffffff; padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #f3f4f6;">
                <div style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <svg style="width: 24px; height: 24px; color: #111827;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="6" y1="11" x2="10" y2="11"/>
                    <line x1="8" y1="9" x2="8" y2="13"/>
                    <line x1="15" y1="12" x2="15.01" y2="12"/>
                    <line x1="18" y1="10" x2="18.01" y2="10"/>
                    <path d="M17.32 5H6.68a4 4 0 0 0-4.6 5.89L8.36 19a2.85 2.85 0 0 0 2.64 2h2a2.85 2.85 0 0 0 2.64-2l6.28-8.11A4 4 0 0 0 17.32 5z"/>
                  </svg>
                  <span style="font-size: 20px; font-weight: 700; color: #111827;">U&I Game Platform</span>
                </div>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">Educational Gaming Made Fun</p>
              </div>

              <!-- Content -->
              <div style="padding: 32px;">
                <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 24px; text-align: center;">You're invited to join!</h1>

                <div style="background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
                  <p style="color: #374151; line-height: 1.6; margin: 0 0 16px;">Hello there!</p>
                  <p style="color: #374151; line-height: 1.6; margin: 0 0 16px;">
                    You've been invited to join <strong>U&I Game Platform</strong> !
                    Click the button below to create your account and start your educational gaming journey:
                  </p>
                </div>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${inviteUrl}"
                     style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    🎮 Create My Account
                  </a>
                </div>

                <!-- Warning Box -->
                <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin: 24px 0;">
                  <p style="color: #92400e; margin: 0; font-size: 14px; font-weight: 500;">
                    ⏰ This invitation will expire in 7 days for security reasons.
                  </p>
                </div>
              </div>

              <!-- Footer -->
              <div style="background: #f9fafb; border-top: 1px solid #f3f4f6; padding: 24px 32px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">
                  If you didn't expect this invitation, you can safely ignore this email.
                </p>
                <p style="color: #374151; margin: 0; font-weight: 500;">
                  Happy Gaming!<br>
                  <strong>The U&I Game Platform Team</strong>
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
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">

              <!-- Header -->
              <div style="background: #ffffff; padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #f3f4f6;">
                <div style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <svg style="width: 24px; height: 24px; color: #111827;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="6" y1="11" x2="10" y2="11"/>
                    <line x1="8" y1="9" x2="8" y2="13"/>
                    <line x1="15" y1="12" x2="15.01" y2="12"/>
                    <line x1="18" y1="10" x2="18.01" y2="10"/>
                    <path d="M17.32 5H6.68a4 4 0 0 0-4.6 5.89L8.36 19a2.85 2.85 0 0 0 2.64 2h2a2.85 2.85 0 0 0 2.64-2l6.28-8.11A4 4 0 0 0 17.32 5z"/>
                  </svg>
                  <span style="font-size: 20px; font-weight: 700; color: #111827;">U&I Game Platform</span>
                </div>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">Educational Gaming Made Fun</p>
              </div>

              <!-- Content -->
              <div style="padding: 32px;">
                <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 24px; text-align: center;">Reset Your Password</h1>

                <div style="background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
                  <p style="color: #374151; line-height: 1.6; margin: 0 0 16px;">Hello there!</p>
                  <p style="color: #374151; line-height: 1.6; margin: 0 0 16px;">
                    You requested to reset your password for your <strong>U&I Game Platform</strong> account.
                  </p>
                  <p style="color: #374151; line-height: 1.6; margin: 0;">
                    Click the button below to set a new password and get back to gaming:
                  </p>
                </div>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${resetUrl}"
                     style="display: inline-block; background-color: #dc2626; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    🔑 Reset My Password
                  </a>
                </div>

                <!-- Warning Box -->
                <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0;">
                  <p style="color: #dc2626; margin: 0; font-size: 14px; font-weight: 500;">
                    ⏰ This password reset link will expire in 1 hour for security reasons.
                  </p>
                </div>
              </div>

              <!-- Footer -->
              <div style="background: #f9fafb; border-top: 1px solid #f3f4f6; padding: 24px 32px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">
                  If you didn't request this password reset, you can safely ignore this email.
                </p>
                <p style="color: #374151; margin: 0; font-weight: 500;">
                  Stay secure!<br>
                  <strong>The U&I Game Platform Team</strong>
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

