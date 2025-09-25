import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params: any) {
        const email = params.email as string;

        return {
          email: email,
          name: email.split("@")[0], // Use email prefix as default name
          role: "student", // Default role - will be updated by afterUserCreatedOrUpdated callback
        };
      },
    }),
  ],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, args) {
      console.log(`[AUTH] afterUserCreatedOrUpdated called with:`, args);

      // Only run for new users (not updates)
      if (args.existingUserId) {
        console.log(`[AUTH] Skipping - existing user update`);
        return;
      }

      // Get the user that was just created
      const user = await ctx.db.get(args.userId);
      console.log(`[AUTH] User created:`, user);

      if (!user || !user.email) {
        console.log(`[AUTH] No user or email found`);
        return;
      }

      // Look for the most recent unused invite token for this email
      const invites = await ctx.db
        .query("inviteTokens")
        .filter((q) => q.eq(q.field("email"), user.email))
        .filter((q) => q.eq(q.field("used"), false))
        .collect();

      // Get the most recent one
      const invite = invites.length > 0 ? invites[invites.length - 1] : null;

      console.log(`[AUTH] Found invite for ${user.email}:`, invite);

      if (invite && invite.role) {
        // Update user with the role from the invite
        await ctx.db.patch(user._id, {
          role: invite.role,
        });

        // Mark the token as used
        await ctx.db.patch(invite._id, { used: true });

        console.log(`[AUTH] Role assigned to ${user.email}: ${invite.role}`);
      } else {
        console.log(`[AUTH] No valid invite found for ${user.email}`);
      }
    },
  },
});
