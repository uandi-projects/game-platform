"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, User } from "lucide-react";
import Header from "@/components/Header";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [soundFeedback, setSoundFeedback] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const currentUser = useQuery(api.users.getCurrentUser);
  const updateProfile = useMutation(api.users.updateProfile);
  const router = useRouter();

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (currentUser === null) {
      router.push("/signin");
    }
  }, [currentUser, router]);

  // Initialize form with current user data
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setPhone(currentUser.phone || "");
      setSoundFeedback(currentUser.soundFeedback ?? true);
      setHapticFeedback(currentUser.hapticFeedback ?? true);
    }
  }, [currentUser]);

  // Check loading states
  if (currentUser === undefined) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <Loader />
        </div>
      </>
    );
  }

  if (!currentUser) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await updateProfile({
        name: name || undefined,
        phone: phone || undefined,
        soundFeedback,
        hapticFeedback
      });
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error: unknown) {
      setMessage({ type: "error", text: (error as Error)?.message || "Failed to update profile" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header />
      <div className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground">
              Manage your account information and preferences
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <User className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-xl">{currentUser.name || "No Name"}</CardTitle>
                <CardDescription className="text-base">{currentUser.email}</CardDescription>
                <div className="mt-2">
                  <Badge variant={
                    currentUser.role === "admin" ? "destructive" :
                    currentUser.role === "teacher" ? "default" :
                    "secondary"
                  }>
                    {currentUser.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : "Student"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Edit Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>
              Update your personal information. Your email address cannot be changed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={currentUser.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email address cannot be changed. Contact an administrator if you need to update this.
                </p>
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  disabled={loading}
                />
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  disabled={loading}
                />
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  type="text"
                  value={currentUser.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : "Student"}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Your role is managed by administrators and cannot be changed.
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="mb-2">
                  <h3 className="text-lg font-medium">Game Feedback Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    Control feedback when answering questions in games
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sound-feedback">Sound Feedback</Label>
                    <p className="text-xs text-muted-foreground">
                      Play sounds for correct and incorrect answers
                    </p>
                  </div>
                  <Switch
                    id="sound-feedback"
                    checked={soundFeedback}
                    onCheckedChange={setSoundFeedback}
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="haptic-feedback">Haptic Feedback</Label>
                    <p className="text-xs text-muted-foreground">
                      Vibrate on touch devices for feedback
                    </p>
                  </div>
                  <Switch
                    id="haptic-feedback"
                    checked={hapticFeedback}
                    onCheckedChange={setHapticFeedback}
                    disabled={loading}
                  />
                </div>
              </div>

              {message && (
                <Alert variant={message.type === "success" ? "default" : "destructive"}>
                  <AlertDescription>
                    {message.text}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Updating..." : "Update Profile"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setName(currentUser.name || "");
                    setPhone(currentUser.phone || "");
                    setSoundFeedback(currentUser.soundFeedback ?? true);
                    setHapticFeedback(currentUser.hapticFeedback ?? true);
                    setMessage(null);
                  }}
                  disabled={loading}
                >
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        </div>
      </div>
    </div>
  );
}