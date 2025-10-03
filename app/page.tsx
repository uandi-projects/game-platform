"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import Header from "@/components/Header";
import { Trophy, Calendar, ArrowRight, MessageSquare } from "lucide-react";

export default function Home() {

  return (
    <div className="min-h-screen">
      <Header />
      <main className="flex flex-col gap-8 w-full">
        <Content />
      </main>
    </div>
  );
}


function Content() {
  const { isAuthenticated } = useConvexAuth();
  const currentUser = useQuery(api.users.getCurrentUser);
  const recentActivity = useQuery(api.games.getUserGameHistory);

  // Show loading state
  if (isAuthenticated && currentUser === undefined) {
    return (
      <div className="flex justify-center">
        <Loader />
      </div>
    );
  }

  // Show welcome content for authenticated users
  if (isAuthenticated && currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Welcome, {currentUser.name || currentUser.email}!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            {currentUser.role === "student" && "Join games using codes or browse available games"}
            {currentUser.role === "teacher" && "Create games, manage students, and track progress"}
            {currentUser.role === "admin" && "Manage users, oversee the platform, and configure settings"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Game Code Entry Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Join a Game</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-md mx-auto">
                <GameCodeEntry />
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full" asChild>
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/progress">View My Progress</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/history">Game History</Link>
                </Button>
                {(currentUser.role === "teacher" || currentUser.role === "admin") && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/analytics">Analytics</Link>
                  </Button>
                )}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/feedback">
                    <MessageSquare className="h-4 w-4 mr-2 inline" />
                    Share Feedback
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="h-6 w-6" />
                Recent Activity
              </span>
              {recentActivity && recentActivity.length > 0 && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/history" className="flex items-center gap-1">
                    View All <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.slice(0, 3).map((activity: any, index: number) => {
                  const formatGameName = (gameId: string | undefined) => {
                    const gameNames: Record<string, string> = {
                      'single-player-math': 'Math Quiz Solo',
                      'multi-player-math': 'Math Race',
                      'custom-math-quiz': 'Custom Math Quiz',
                      'custom-math-race': 'Custom Math Race',
                      'ai-mcq-quiz': 'AI MCQ Quiz'
                    };
                    return gameNames[gameId || ''] || 'Unknown Game';
                  };

                  const formatDate = (timestamp: number) => {
                    const now = Date.now();
                    const diff = now - timestamp;
                    const minutes = Math.floor(diff / (1000 * 60));
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

                    if (minutes < 1) return 'Just now';
                    if (minutes < 60) return `${minutes}m ago`;
                    if (hours < 24) return `${hours}h ago`;
                    if (days < 7) return `${days}d ago`;
                    return new Date(timestamp).toLocaleDateString();
                  };

                  const accuracy = activity.questionsAnswered > 0 ? Math.round((activity.score / activity.questionsAnswered) * 100) : 0;

                  return (
                    <div key={`${activity.gameCode}-${index}`} className="flex items-center justify-between p-4 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Trophy className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{formatGameName(activity.gameId)}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>Score: {activity.score}</span>
                            <span>Accuracy: {accuracy}%</span>
                            <span>{activity.questionsAnswered}/{activity.totalQuestions} questions</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={activity.isCompleted ? "default" : "secondary"}>
                          {activity.isCompleted ? "Completed" : "In Progress"}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(activity.completedAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No recent activity</p>
                  <p className="text-sm">Play your first game to see your activity here!</p>
                  <Button className="mt-4" asChild>
                    <Link href="/dashboard">Browse Games</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show public landing page for unauthenticated users
  return (
    <div className="max-w-4xl mx-auto px-4 pt-8 text-center">
      <h1 className="text-5xl font-bold mb-6">Educational Game Platform</h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-12">
        Join interactive learning games or create your own educational experiences
      </p>

      {/* Game Code Entry for Public Users */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Join a Game</CardTitle>
          <CardDescription>
            Have a game code? Enter it below to join the fun!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-md mx-auto">
            <GameCodeEntry />
          </div>
        </CardContent>
      </Card>

      {/* Feature highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">For Students</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Join multiplayer games, compete with classmates, and track your learning progress
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">For Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Create engaging games, manage student progress, and make learning fun
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">For Administrators</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Manage users, oversee platform usage, and configure system settings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Feedback Button */}
      <div className="mt-8">
        <Button variant="outline" size="lg" asChild>
          <Link href="/feedback" className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Share Your Feedback
          </Link>
        </Button>
      </div>
    </div>
  );
}

function GameCodeEntry() {
  const [gameCode, setGameCode] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameCode.length === 6) {
      router.push(`/game/${gameCode.toUpperCase()}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        type="text"
        value={gameCode}
        onChange={(e) => setGameCode(e.target.value.toUpperCase())}
        placeholder="6-letter game code"
        maxLength={6}
        className="text-center text-xl font-mono tracking-widest uppercase"
        pattern="[A-Z0-9]{6}"
        required
      />
      <Button
        type="submit"
        disabled={gameCode.length !== 6}
        className="text-lg font-semibold"
        size="lg"
      >
        Join Game
      </Button>
    </form>
  );
}


