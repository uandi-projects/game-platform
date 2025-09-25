"use client";

import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const token = searchParams.get("token");

  const resetPassword = useAction(api.invites.resetPassword);

  // Validate token on page load
  useEffect(() => {
    if (email && token) {
      // We'll validate the token when the user tries to submit
      // For UX, we assume it's valid initially
      setTokenValid(true);
      setValidatingToken(false);
    } else {
      setError("Invalid reset link. Please check your email for the correct link.");
      setValidatingToken(false);
    }
  }, [email, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !token) return;

    setLoading(true);
    setError(null);

    // Validate passwords
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    try {
      await resetPassword({ email, token, newPassword: password });

      // Success - redirect to sign in
      router.push("/signin?message=Password reset successful. Please sign in with your new password.");
    } catch (error: any) {
      setError(error.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <div className="flex flex-col gap-8 w-96 mx-auto h-screen justify-center items-center">
        <p>Validating reset link...</p>
      </div>
    );
  }

  if (!email || !token || !tokenValid) {
    return (
      <div className="flex flex-col gap-8 w-96 mx-auto h-screen justify-center items-center">
        <div className="bg-red-500/20 border-2 border-red-500/50 rounded-md p-4 text-center">
          <p className="text-foreground font-mono text-sm mb-4">
            {error || "Invalid or expired reset link. Please request a new password reset."}
          </p>
          <Link
            href="/forgot-password"
            className="text-sm underline hover:no-underline"
          >
            Request new password reset
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-96 mx-auto h-screen justify-center items-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Set New Password</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Enter your new password for <strong>{email}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
        <input
          className="bg-background text-foreground rounded-md p-3 border-2 border-slate-200 dark:border-slate-800"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New Password"
          required
          minLength={8}
          disabled={loading}
        />

        <input
          className="bg-background text-foreground rounded-md p-3 border-2 border-slate-200 dark:border-slate-800"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm New Password"
          required
          minLength={8}
          disabled={loading}
        />

        <button
          className="bg-foreground text-background rounded-md p-3 disabled:opacity-50"
          type="submit"
          disabled={loading || !password || !confirmPassword}
        >
          {loading ? "Resetting Password..." : "Reset Password"}
        </button>

        <div className="text-center">
          <Link
            href="/signin"
            className="text-sm text-gray-600 dark:text-gray-400 underline hover:no-underline"
          >
            Back to Sign In
          </Link>
        </div>

        {error && (
          <div className="bg-red-500/20 border-2 border-red-500/50 rounded-md p-3">
            <p className="text-foreground text-sm">
              {error}
            </p>
          </div>
        )}
      </form>

      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        <p>Password requirements:</p>
        <ul className="list-disc list-inside mt-1">
          <li>At least 8 characters long</li>
          <li>Must match confirmation</li>
        </ul>
      </div>
    </div>
  );
}