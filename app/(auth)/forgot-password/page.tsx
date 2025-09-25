"use client";

import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!submitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !email}
                className="w-full"
              >
                {loading ? "Sending Reset Link..." : "Send Reset Link"}
              </Button>

              <div className="text-center">
                <Button variant="link" asChild>
                  <Link href="/signin">
                    Back to Sign In
                  </Link>
                </Button>
              </div>

              {message && (
                <Alert variant={message.type === "success" ? "default" : "destructive"}>
                  <AlertDescription>
                    {message.text}
                  </AlertDescription>
                </Alert>
              )}
            </form>
          ) : (
            <div className="flex flex-col gap-4 text-center">
              <Alert>
                <AlertDescription>
                  If an account with that email exists, we've sent password reset instructions.
                  Please check your email and follow the link to reset your password.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSubmitted(false);
                    setMessage(null);
                  }}
                >
                  Try a different email
                </Button>

                <Button variant="link" asChild>
                  <Link href="/signin">
                    Back to Sign In
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}