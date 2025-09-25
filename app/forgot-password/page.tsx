"use client";

import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const sendPasswordReset = useAction(api.invites.sendPasswordResetEmail);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage(null);

    try {
      await sendPasswordReset({ email });
      setMessage({
        type: "success",
        text: "If an account with that email exists, we've sent password reset instructions."
      });
      setSubmitted(true);
      setEmail("");
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to send password reset email"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-96 mx-auto h-screen justify-center items-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Reset Your Password</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      {!submitted ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
          <input
            className="bg-background text-foreground rounded-md p-3 border-2 border-slate-200 dark:border-slate-800"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
            disabled={loading}
          />

          <button
            className="bg-foreground text-background rounded-md p-3 disabled:opacity-50"
            type="submit"
            disabled={loading || !email}
          >
            {loading ? "Sending Reset Link..." : "Send Reset Link"}
          </button>

          <div className="text-center">
            <Link
              href="/signin"
              className="text-sm text-gray-600 dark:text-gray-400 underline hover:no-underline"
            >
              Back to Sign In
            </Link>
          </div>

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
      ) : (
        <div className="flex flex-col gap-4 w-full text-center">
          <div className="bg-green-500/20 border-2 border-green-500/50 rounded-md p-4">
            <p className="text-foreground text-sm">
              If an account with that email exists, we've sent password reset instructions.
              Please check your email and follow the link to reset your password.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                setSubmitted(false);
                setMessage(null);
              }}
              className="text-sm text-gray-600 dark:text-gray-400 underline hover:no-underline"
            >
              Try a different email
            </button>

            <Link
              href="/signin"
              className="text-sm text-gray-600 dark:text-gray-400 underline hover:no-underline"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}