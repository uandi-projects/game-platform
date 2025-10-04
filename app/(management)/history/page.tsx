"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Header from "@/components/Header";
import {
  Calendar,
  Trophy,
  Target,
  Clock,
  ArrowLeft,
  Gamepad2,
  Users,
  User
} from "lucide-react";

export default function HistoryPage() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const gameHistory = useQuery(api.games.getUserGameHistory);
  const router = useRouter();

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (currentUser === null) {
      router.push("/signin");
    }
  }, [currentUser, router]);

  // Check loading states
  if (currentUser === undefined || gameHistory === undefined) {
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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  const getScoreColor = (score: number, totalQuestions: number) => {
    const percentage = (score / totalQuestions) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number, totalQuestions: number) => {
    const percentage = (score / totalQuestions) * 100;
    if (percentage >= 90) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (percentage >= 70) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
    if (percentage >= 50) return <Badge className="bg-yellow-100 text-yellow-800">Average</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Practice</Badge>;
  };

  // Calculate summary stats
  const completedGames = gameHistory?.filter((game: any) => game.isCompleted) || [];
  const totalScore = completedGames.reduce((sum: any, game: any) => sum + game.score, 0);
  const totalQuestions = completedGames.reduce((sum: any, game: any) => sum + game.questionsAnswered, 0);
  const averageScore = completedGames.length > 0 ? Math.round((totalScore / completedGames.length)) : 0;
  const averageAccuracy = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

  return (
    <div>
      <Header />
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="icon" asChild className="hidden sm:inline-flex">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Game History</h1>
              <p className="text-muted-foreground">Review your past games and achievements</p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Games Played</p>
                    <p className="text-2xl font-bold">{gameHistory?.length || 0}</p>
                  </div>
                  <Gamepad2 className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold">{completedGames.length}</p>
                  </div>
                  <Trophy className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                    <p className="text-2xl font-bold">{averageScore}</p>
                  </div>
                  <Target className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Accuracy</p>
                    <p className="text-2xl font-bold">{averageAccuracy}%</p>
                  </div>
                  <Target className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Game History Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Games
              </CardTitle>
            </CardHeader>
            <CardContent>
              {gameHistory && gameHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Game</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Questions</TableHead>
                        <TableHead>Performance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gameHistory.map((game: any, index: number) => {
                        const accuracy = game.questionsAnswered > 0 ? Math.round((game.score / game.questionsAnswered) * 100) : 0;

                        return (
                          <TableRow key={`${game.gameCode}-${index}`}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium">{formatGameName(game.gameId)}</div>
                                  <div className="text-xs text-muted-foreground">#{game.gameCode}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                {game.gameType === 'single-player' ? <User className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                                {game.gameType === 'single-player' ? 'Solo' : 'Multi'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className={`font-medium ${getScoreColor(game.score, game.questionsAnswered)}`}>
                                {game.score}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {game.questionsAnswered} / {game.totalQuestions}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getScoreBadge(game.score, game.questionsAnswered)}
                                <span className="text-xs text-muted-foreground">
                                  {accuracy}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {game.isCompleted ? (
                                <Badge className="bg-green-100 text-green-800">
                                  Completed
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  In Progress
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatDate(game.completedAt)}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No games played yet</p>
                    <p className="text-sm">Start playing to see your game history here</p>
                    <Button className="mt-4" asChild>
                      <Link href="/dashboard">Play a Game</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}