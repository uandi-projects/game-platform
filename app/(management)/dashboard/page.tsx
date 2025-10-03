"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import Header from "@/components/Header";
import {
  Gamepad2,
  Users,
  BarChart3,
  Settings,
  UserPlus,
  Calendar,
  Trophy
} from "lucide-react";

export default function DashboardPage() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const availableGames = useQuery(api.games.getAvailableGames);
  const recentActivity = useQuery(api.games.getUserGameHistory);
  const createGameInstance = useMutation(api.games.createGameInstance);
  const router = useRouter();
  const [isCreatingGame, setIsCreatingGame] = useState<string | null>(null);

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (currentUser === null) {
      router.push("/signin");
    }
  }, [currentUser, router]);

  // Check loading states
  if (currentUser === undefined) {
    return (
      <div>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <Loader />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div>
      <Header />
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Welcome, {currentUser.name || currentUser.email}!
            </h1>
            <p className="text-lg text-muted-foreground flex items-center gap-2">
              <Badge variant={
                currentUser.role === "admin" ? "destructive" :
                currentUser.role === "teacher" ? "default" :
                "secondary"
              }>
                {currentUser.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : "Student"}
              </Badge>
              {currentUser.role === "student" && "Join games, track progress, and learn"}
              {currentUser.role === "teacher" && "Create games, manage students, and track progress"}
              {currentUser.role === "admin" && "Manage users, oversee the platform, and configure settings"}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quick Join</CardTitle>
                <Gamepad2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Game Code</div>
                <p className="text-xs text-muted-foreground">Enter a code to join a game</p>
                <Button size="sm" className="mt-2 w-full" asChild>
                  <Link href="/">Enter Code</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profile</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Settings</div>
                <p className="text-xs text-muted-foreground">Manage your account</p>
                <Button size="sm" variant="outline" className="mt-2 w-full" asChild>
                  <Link href="/profile">View Profile</Link>
                </Button>
              </CardContent>
            </Card>

            {(currentUser.role === "teacher" || currentUser.role === "admin") && (
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Invite Users</CardTitle>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Add People</div>
                  <p className="text-xs text-muted-foreground">Invite students or teachers</p>
                  <Button size="sm" variant="outline" className="mt-2 w-full" asChild>
                    <Link href="/invite">Send Invites</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {currentUser.role === "admin" && (
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Admin Panel</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Manage</div>
                  <p className="text-xs text-muted-foreground">User management</p>
                  <Button size="sm" variant="destructive" className="mt-2 w-full" asChild>
                    <Link href="/admin">Open Admin</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Available Games */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Available Games</h2>
            {availableGames === undefined ? (
              <div className="flex items-center justify-center h-32">
                <Loader />
              </div>
            ) : availableGames === null || availableGames.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    <div className="text-center">
                      <Gamepad2 className="h-8 w-8 mx-auto mb-2" />
                      <p>No games available at the moment</p>
                      <p className="text-sm">Check back later for new games!</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableGames.map((game: any) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    isCreating={isCreatingGame === game.id}
                    onPlay={async () => {
                      setIsCreatingGame(game.id);
                      try {
                        if (game.isCustom) {
                          // Redirect to custom game creation page
                          router.push(`/game/${game.id}/create`);
                        } else {
                          // Create regular game instance directly
                          const instance = await createGameInstance({ gameId: game.id });

                          // Redirect based on game type to avoid flash
                          if (instance.type === "multiplayer") {
                            router.push(`/room/${instance.code}`);
                          } else {
                            router.push(`/game/${instance.gameId}/${instance.code}`);
                          }
                        }
                      } catch (error) {
                        console.error("Failed to create game instance:", error);
                      } finally {
                        setIsCreatingGame(null);
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Quick Access Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <Trophy className="h-6 w-6 text-muted-foreground" />
                  <div className="text-right">
                    <h3 className="text-xl font-bold mb-1">My Progress</h3>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm mb-4">
                  View your learning progress and achievements
                </p>
                <Button size="sm" variant="outline" className="w-full" asChild>
                  <Link href="/progress">View Progress</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                  <div className="text-right">
                    <h3 className="text-xl font-bold mb-1">Game History</h3>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm mb-4">
                  Review past games and achievements
                </p>
                <Button size="sm" variant="outline" className="w-full" asChild>
                  <Link href="/history">View History</Link>
                </Button>
              </CardContent>
            </Card>

            {(currentUser.role === "teacher" || currentUser.role === "admin") && (
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <BarChart3 className="h-6 w-6 text-muted-foreground" />
                    <div className="text-right">
                      <h3 className="text-xl font-bold mb-1">Analytics</h3>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">
                    View student performance and engagement
                  </p>
                  <Button size="sm" variant="outline" className="w-full" asChild>
                    <Link href="/analytics">View Analytics</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent Activity Section */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
            <Card>
              <CardContent className="p-6">
                {recentActivity && recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.slice(0, 5).map((activity: any, index: number) => {
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
                        return new Date(timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                      };

                      return (
                        <div key={`${activity.gameCode}-${index}`} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-primary/10">
                              <Trophy className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{formatGameName(activity.gameId)}</p>
                              <p className="text-sm text-muted-foreground">
                                Score: {activity.score} ({activity.questionsAnswered}/{activity.totalQuestions})
                              </p>
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
                    {recentActivity.length > 5 && (
                      <div className="text-center pt-4">
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/history">View All History</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    <div className="text-center">
                      <Calendar className="h-8 w-8 mx-auto mb-2" />
                      <p>No recent activity to display</p>
                      <p className="text-sm">Your game activity will appear here</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function GameCard({ game, isCreating, onPlay }: {
  game: {
    id: string;
    name: string;
    type: string;
    description: string;
    isCustom?: boolean;
  };
  isCreating: boolean;
  onPlay: () => void;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <Gamepad2 className="h-6 w-6 text-muted-foreground" />
          <div className="flex gap-2">
            <Badge variant={game.type === "single-player" ? "secondary" : "default"}>
              {game.type === "single-player" ? "Single Player" : "Multiplayer"}
            </Badge>
            {game.isCustom && (
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                Custom
              </Badge>
            )}
          </div>
        </div>
        <h3 className="text-xl font-bold mb-2">{game.name}</h3>
        <p className="text-muted-foreground text-sm mb-4">{game.description}</p>
        <Button
          size="sm"
          className="w-full"
          onClick={onPlay}
          disabled={isCreating}
        >
          {isCreating ? (
            <>
              <Loader className="mr-2 h-4 w-4" />
              {game.isCustom ? "Opening..." : "Starting..."}
            </>
          ) : (
            game.isCustom ? "Configure & Play" : "Play Now"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}