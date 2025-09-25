"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";

// This page handles both:
// 1. Invite signup flow (when email and token are present in URL)
// 2. Sending invites (when accessed directly by admins/teachers)
export default function InvitePage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL params for invite signup
  const email = searchParams.get("email");
  const token = searchParams.get("token");

  // State for invite signup
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupLoading, setSignupLoading] = useState(false);

  // State for sending invites
  const [inviteEmail, setInviteEmail] = useState("");
  const [role, setRole] = useState<"admin" | "teacher" | "student">("student");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Convex hooks
  const sendInvite = useAction(api.invites.sendInviteEmail);
  const currentUser = useQuery(api.users.getCurrentUser);
  const invitableRoles = useQuery(api.invites.getMyInvitableRoles);

  // Set initial role to first available role
  useEffect(() => {
    if (invitableRoles && invitableRoles.length > 0) {
      setRole(invitableRoles[0] as "admin" | "teacher" | "student");
    }
  }, [invitableRoles]);

  // Check for signup flow
  const isSignupFlow = email && token;

  useEffect(() => {
    if (isSignupFlow && (!email || !token)) {
      setSignupError("Invalid invitation link. Please check your email for the correct link.");
    }
  }, [email, token, isSignupFlow]);

  // Redirect to signin if not authenticated (for invite sending flow)
  useEffect(() => {
    if (!isSignupFlow && currentUser === null) {
      router.push("/signin");
    }
  }, [currentUser, router, isSignupFlow]);

  // Handle signup form submission
  const handleSignupSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !token) return;

    setSignupLoading(true);
    setSignupError(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setSignupError("Passwords do not match");
      setSignupLoading(false);
      return;
    }

    if (password.length < 8) {
      setSignupError("Password must be at least 8 characters long");
      setSignupLoading(false);
      return;
    }

    try {
      const signUpFormData = new FormData();
      signUpFormData.set("email", email);
      signUpFormData.set("password", password);
      signUpFormData.set("flow", "signUp");
      signUpFormData.set("token", token);

      await signIn("password", signUpFormData);
      router.push("/");
    } catch (error: any) {
      setSignupError(error.message || "Failed to create account");
    } finally {
      setSignupLoading(false);
    }
  };

  // Handle invite form submission
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviteLoading(true);
    setMessage(null);

    try {
      await sendInvite({ email: inviteEmail, role });
      setMessage({ type: "success", text: `${role} invite sent successfully to ${inviteEmail}` });
      setInviteEmail("");
      setRole(invitableRoles?.[0] || "student");
    } catch (error: unknown) {
      setMessage({ type: "error", text: (error as Error)?.message || "Failed to send invite" });
    } finally {
      setInviteLoading(false);
    }
  };

  // Show signup form if this is a signup flow
  if (isSignupFlow) {
    if (!email || !token) {
      return (
        <div className="flex flex-col gap-8 w-96 mx-auto h-screen justify-center items-center">
          <div className="bg-red-500/20 border-2 border-red-500/50 rounded-md p-4">
            <p className="text-foreground font-mono text-sm">
              Invalid invitation link. Please check your email for the correct link.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-8 w-96 mx-auto h-screen justify-center items-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Create Your Account</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You've been invited to join. Create a password for <strong>{email}</strong>
          </p>
        </div>

        <form className="flex flex-col gap-4 w-full" onSubmit={handleSignupSubmit}>
          <input
            className="bg-background text-foreground rounded-md p-2 border-2 border-slate-200 dark:border-slate-800"
            type="password"
            name="password"
            placeholder="Create Password"
            required
            minLength={8}
            disabled={signupLoading}
          />
          <input
            className="bg-background text-foreground rounded-md p-2 border-2 border-slate-200 dark:border-slate-800"
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            required
            minLength={8}
            disabled={signupLoading}
          />
          <button
            className="bg-foreground text-background rounded-md p-2 disabled:opacity-50"
            type="submit"
            disabled={signupLoading}
          >
            {signupLoading ? "Creating Account..." : "Create Account"}
          </button>

          {signupError && (
            <div className="bg-red-500/20 border-2 border-red-500/50 rounded-md p-2">
              <p className="text-foreground font-mono text-xs">
                {signupError}
              </p>
            </div>
          )}
        </form>
      </div>
    );
  }

  // Show loading state for invite sending flow
  if (currentUser === undefined || invitableRoles === undefined) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  // Check if user has permission to invite
  if (!invitableRoles || invitableRoles.length === 0) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-4">You don&apos;t have permission to invite users.</p>
          <button
            onClick={() => router.push("/")}
            className="bg-foreground text-background px-4 py-2 rounded-md"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Show invite sending form
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Send Invites</h1>
          <div className="flex gap-2">
            {currentUser.role === "admin" && (
              <button
                onClick={() => router.push("/admin")}
                className="bg-slate-200 dark:bg-slate-800 text-foreground px-3 py-1 rounded-md text-sm hover:opacity-80 transition-opacity"
              >
                User Management
              </button>
            )}
            <button
              onClick={() => router.push("/")}
              className="bg-slate-200 dark:bg-slate-800 text-foreground px-3 py-1 rounded-md text-sm hover:opacity-80 transition-opacity"
            >
              Home
            </button>
          </div>
        </div>

        <p className="text-center mb-4 text-sm text-gray-600 dark:text-gray-400">
          Your role: <span className="font-semibold capitalize">{currentUser.role || "student"}</span>
        </p>

        <form onSubmit={handleInviteSubmit} className="flex flex-col gap-4">
          <input
            className="bg-background text-foreground rounded-md p-3 border-2 border-slate-200 dark:border-slate-800"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Enter email to invite"
            required
            disabled={inviteLoading}
          />

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground">Role</label>
            <select
              className="bg-background text-foreground rounded-md p-3 border-2 border-slate-200 dark:border-slate-800"
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "teacher" | "student")}
              disabled={inviteLoading}
            >
              {invitableRoles.map((invitableRole) => (
                <option key={invitableRole} value={invitableRole}>
                  {invitableRole.charAt(0).toUpperCase() + invitableRole.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <button
            className="bg-foreground text-background rounded-md p-3 disabled:opacity-50"
            type="submit"
            disabled={inviteLoading || !inviteEmail}
          >
            {inviteLoading ? "Sending Invite..." : `Send ${role} Invite`}
          </button>

          {message && (
            <div className={`rounded-md p-3 ${
              message.type === "success"
                ? "bg-green-500/20 border-2 border-green-500/50"
                : "bg-red-500/20 border-2 border-red-500/50"
            }`}>
              <p className="text-foreground text-sm">
                {message.text}
              </p>
            </div>
          )}
        </form>

        <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-800 rounded-md">
          <h2 className="font-semibold mb-2">Instructions:</h2>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Enter an email address to send an invitation</li>
            <li>• The invite link expires in 7 days</li>
            <li>• Users will create their password when they accept the invite</li>
            <li>• Admins can invite any role</li>
            <li>• Teachers can only invite students</li>
            <li>• Students cannot invite anyone</li>
          </ul>
        </div>
      </div>
    </div>
  );
}