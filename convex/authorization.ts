import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { QueryCtx, MutationCtx, ActionCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Define valid roles
export const VALID_ROLES = {
  STUDENT: "student" as const,
  TEACHER: "teacher" as const,
  ADMIN: "admin" as const,
} as const;

export type Role = typeof VALID_ROLES[keyof typeof VALID_ROLES];

// Role hierarchy - higher numbers have more permissions
const roleHierarchy = {
  [VALID_ROLES.STUDENT]: 0,
  [VALID_ROLES.TEACHER]: 1,
  [VALID_ROLES.ADMIN]: 2,
};

/**
 * Get the current authenticated user with role information
 */
export async function getAuthenticatedUser(
  ctx: QueryCtx | MutationCtx
) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError("Not authenticated");
  }

  const user = await ctx.db.get(userId);
  if (!user) {
    throw new ConvexError("User not found");
  }

  return user;
}

/**
 * Check if the current user has a specific role or higher
 */
export async function hasRole(
  ctx: QueryCtx | MutationCtx,
  requiredRole: Role
): Promise<boolean> {
  try {
    const user = await getAuthenticatedUser(ctx);
    const userRole = user.role || VALID_ROLES.STUDENT; // Default to student role

    return roleHierarchy[userRole as keyof typeof roleHierarchy] >= roleHierarchy[requiredRole];
  } catch {
    return false;
  }
}

/**
 * Require a specific role or throw an error
 */
export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  requiredRole: Role
): Promise<void> {
  const hasRequiredRole = await hasRole(ctx, requiredRole);
  if (!hasRequiredRole) {
    throw new ConvexError(`Access denied. Required role: ${requiredRole}`);
  }
}

/**
 * Require admin role
 */
export async function requireAdmin(
  ctx: QueryCtx | MutationCtx
): Promise<void> {
  await requireRole(ctx, VALID_ROLES.ADMIN);
}

/**
 * Check if user is admin
 */
export async function isAdmin(
  ctx: QueryCtx | MutationCtx
): Promise<boolean> {
  return hasRole(ctx, VALID_ROLES.ADMIN);
}

/**
 * Require teacher role or higher
 */
export async function requireTeacher(
  ctx: QueryCtx | MutationCtx
): Promise<void> {
  await requireRole(ctx, VALID_ROLES.TEACHER);
}

/**
 * Check if user is teacher or higher
 */
export async function isTeacher(
  ctx: QueryCtx | MutationCtx
): Promise<boolean> {
  return hasRole(ctx, VALID_ROLES.TEACHER);
}

/**
 * Get user role or default to user
 */
export async function getUserRole(
  ctx: QueryCtx | MutationCtx
): Promise<Role> {
  try {
    const user = await getAuthenticatedUser(ctx);
    return (user.role as Role) || VALID_ROLES.STUDENT;
  } catch {
    throw new ConvexError("Not authenticated");
  }
}

/**
 * Set user role (admin only)
 */
export async function setUserRole(
  ctx: MutationCtx,
  userId: Id<"users">,
  role: Role
): Promise<void> {
  // Only admins can set roles
  await requireAdmin(ctx);

  await ctx.db.patch(userId, { role });
}

/**
 * Get roles that the current user can invite
 */
export async function getInvitableRoles(
  ctx: QueryCtx | MutationCtx
): Promise<Role[]> {
  try {
    const userRole = await getUserRole(ctx);

    switch (userRole) {
      case VALID_ROLES.ADMIN:
        // Admins can invite any role
        return [VALID_ROLES.ADMIN, VALID_ROLES.TEACHER, VALID_ROLES.STUDENT];
      case VALID_ROLES.TEACHER:
        // Teachers can only invite students
        return [VALID_ROLES.STUDENT];
      case VALID_ROLES.STUDENT:
        // Students cannot invite anyone
        return [];
      default:
        return [];
    }
  } catch {
    return [];
  }
}

/**
 * Check if current user can invite a specific role
 */
export async function canInviteRole(
  ctx: QueryCtx | MutationCtx,
  targetRole: Role
): Promise<boolean> {
  const invitableRoles = await getInvitableRoles(ctx);
  return invitableRoles.includes(targetRole);
}