"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader } from "@/components/ui/loader";
import Header from "@/components/Header";
import { Eye, EyeOff } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    } catch (error) {
      setSignupError(error instanceof Error ? error.message : "Failed to create account");
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
          <Alert variant="destructive">
            <AlertDescription>
              Invalid invitation link. Please check your email for the correct link.
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-8 w-96 mx-auto h-screen justify-center items-center">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create Your Account</CardTitle>
            <CardDescription>
              You&apos;ve been invited to join. Create a password for <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={handleSignupSubmit}>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Create Password"
                    required
                    minLength={8}
                    disabled={signupLoading}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={signupLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="sr-only">
                      {showPassword ? "Hide password" : "Show password"}
                    </span>
                  </Button>
                </div>
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    required
                    minLength={8}
                    disabled={signupLoading}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={signupLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="sr-only">
                      {showConfirmPassword ? "Hide password" : "Show password"}
                    </span>
                  </Button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={signupLoading}
                className="w-full"
              >
                {signupLoading ? "Creating Account..." : "Create Account"}
              </Button>

              {signupError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {signupError}
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state for invite sending flow
  if (currentUser === undefined || invitableRoles === undefined) {
    return (
      <div>
        <Header />
        <div className="min-h-screen p-8 flex items-center justify-center">
          <Loader />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  // Check if user has permission to invite
  if (!invitableRoles || invitableRoles.length === 0) {
    return (
      <div>
        <Header />
        <div className="min-h-screen p-8 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
              <p className="mb-4">You don&apos;t have permission to invite users.</p>
              <Button onClick={() => router.push("/")}>Go Home</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show invite sending form
  return (
    <div>
      <Header />
      <div className="min-h-screen p-8">
        <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Send Invites</h1>
          <div className="flex gap-2">
            {currentUser.role === "admin" && (
              <Button variant="outline" size="sm" onClick={() => router.push("/admin")}>
                User Management
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => router.push("/")}>
              Home
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardDescription className="text-center">
              Your role: <span className="font-semibold capitalize">{currentUser.role || "student"}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInviteSubmit} className="flex flex-col gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="inviteEmail">Email Address</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email to invite"
                  required
                  disabled={inviteLoading}
                />
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(value) => setRole(value as "admin" | "teacher" | "student")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {invitableRoles.map((invitableRole: any) => (
                      <SelectItem key={invitableRole} value={invitableRole}>
                        {invitableRole.charAt(0).toUpperCase() + invitableRole.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={inviteLoading || !inviteEmail}
                className="w-full"
              >
                {inviteLoading ? "Sending Invite..." : `Send ${role} Invite`}
              </Button>

              {message && (
                <Alert variant={message.type === "success" ? "default" : "destructive"}>
                  <AlertDescription>
                    {message.text}
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Enter an email address to send an invitation</li>
              <li>• The invite link expires in 7 days</li>
              <li>• Users will create their password when they accept the invite</li>
              <li>• Admins can invite any role</li>
              <li>• Teachers can only invite students</li>
              <li>• Students cannot invite anyone</li>
            </ul>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}