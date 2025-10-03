"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare, Send, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function FeedbackPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!comment.trim()) {
      setError("Please enter your feedback");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          comment: comment.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit feedback");
      }

      setIsSuccess(true);
      setName("");
      setComment("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
            <h2 className="text-2xl font-bold">Thank You!</h2>
            <p className="text-muted-foreground">
              Your feedback has been submitted successfully. We appreciate you taking the time to help us improve!
            </p>
            <div className="flex gap-3 pt-4">
              <Button onClick={() => setIsSuccess(false)} className="flex-1">
                Submit Another
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
            ← Back to Dashboard
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl">Share Your Feedback</CardTitle>
            </div>
            <CardDescription>
              Help us improve! Share bugs you've found, ideas for new features, or general comments about the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Name Input */}
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-lg"
                  disabled={isSubmitting}
                />
                <p className="text-sm text-muted-foreground">
                  Let us know who you are so we can follow up if needed.
                </p>
              </div>

              {/* Comment Textarea */}
              <div className="space-y-2">
                <Label htmlFor="comment">Your Feedback</Label>
                <Textarea
                  id="comment"
                  placeholder="Share bugs, feature ideas, or general comments..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[200px] resize-none"
                  disabled={isSubmitting}
                />
                <p className="text-sm text-muted-foreground">
                  Be as detailed as you'd like. We read every submission!
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">What to share?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>🐛 <strong>Bugs:</strong> Something not working as expected?</li>
                  <li>💡 <strong>Ideas:</strong> Have a feature suggestion?</li>
                  <li>💬 <strong>Comments:</strong> General thoughts about the platform?</li>
                  <li>🎮 <strong>Games:</strong> Ideas for new games or improvements?</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button type="submit" className="flex-1" size="lg" disabled={isSubmitting}>
                  <Send className="h-5 w-5 mr-2" />
                  {isSubmitting ? "Submitting..." : "Submit Feedback"}
                </Button>
                <Button asChild variant="outline" size="lg" disabled={isSubmitting}>
                  <Link href="/dashboard">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
