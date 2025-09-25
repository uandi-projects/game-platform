"use client";

import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "teacher" | "student">("student");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const sendInvite = useAction(api.invites.sendInviteEmail);
  const currentUser = useQuery(api.users.getCurrentUser);
  const invitableRoles = useQuery(api.invites.getMyInvitableRoles);
  const router = useRouter();

  // Set initial role to first available role
  useEffect(() => {
    if (invitableRoles && invitableRoles.length > 0) {
      setRole(invitableRoles[0] as "admin" | "teacher" | "student");
    }
  }, [invitableRoles]);

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (currentUser === null) {
      router.push("/signin");
    }
  }, [currentUser, router]);

  // Check loading states
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

  // Check if user has permission to invite anyone
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage(null);

    try {
      await sendInvite({ email, role });
      setMessage({ type: "success", text: `${role} invite sent successfully to ${email}` });
      setEmail("");
      setRole(invitableRoles[0] || "student");
    } catch (error: unknown) {
      setMessage({ type: "error", text: (error as Error)?.message || "Failed to send invite" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Send Invites</h1>
        <p className="text-center mb-4 text-sm text-gray-600 dark:text-gray-400">
          Your role: <span className="font-semibold capitalize">{currentUser.role || "student"}</span>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            className="bg-background text-foreground rounded-md p-3 border-2 border-slate-200 dark:border-slate-800"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email to invite"
            required
            disabled={loading}
          />

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground">Role</label>
            <select
              className="bg-background text-foreground rounded-md p-3 border-2 border-slate-200 dark:border-slate-800"
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "teacher" | "student")}
              disabled={loading}
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
            disabled={loading || !email}
          >
            {loading ? "Sending Invite..." : `Send ${role} Invite`}
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