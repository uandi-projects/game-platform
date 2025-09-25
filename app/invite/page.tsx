"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function InviteSignUp() {
  const { signIn } = useAuthActions();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const token = searchParams.get("token");

  useEffect(() => {
    if (!email || !token) {
      setError("Invalid invitation link. Please check your email for the correct link.");
    }
  }, [email, token]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !token) return;

    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

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
      // Set up form data for password sign up
      const signUpFormData = new FormData();
      signUpFormData.set("email", email);
      signUpFormData.set("password", password);
      signUpFormData.set("flow", "signUp");
      signUpFormData.set("token", token);

      // Sign up - role assignment happens automatically in auth callback
      await signIn("password", signUpFormData);

      // Redirect to home - user should now have proper role assigned
      router.push("/");
    } catch (error: any) {
      setError(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

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

      <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit}>
        <input
          className="bg-background text-foreground rounded-md p-2 border-2 border-slate-200 dark:border-slate-800"
          type="password"
          name="password"
          placeholder="Create Password"
          required
          minLength={8}
          disabled={loading}
        />
        <input
          className="bg-background text-foreground rounded-md p-2 border-2 border-slate-200 dark:border-slate-800"
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          required
          minLength={8}
          disabled={loading}
        />
        <button
          className="bg-foreground text-background rounded-md p-2 disabled:opacity-50"
          type="submit"
          disabled={loading}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        {error && (
          <div className="bg-red-500/20 border-2 border-red-500/50 rounded-md p-2">
            <p className="text-foreground font-mono text-xs">
              {error}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}