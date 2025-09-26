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
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import Header from "@/components/Header";
import {
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  Award,
  BarChart3,
  ArrowLeft
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

const chartConfig = {
  score: {
    label: "Average Score",
    color: "hsl(var(--chart-1))",
  },
  games: {
    label: "Games Played",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export default function ProgressPage() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const progressStats = useQuery(api.games.getUserProgressStats);
  const router = useRouter();

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (currentUser === null) {
      router.push("/signin");
    }
  }, [currentUser, router]);

  // Check loading states
  if (currentUser === undefined || progressStats === undefined) {
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

  const {
    totalGames,
    averageScore,
    totalQuestions,
    accuracyRate,
    recentGames,
    dailyStats,
    achievements
  } = progressStats;

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
              <h1 className="text-3xl md:text-4xl font-bold">My Progress</h1>
              <p className="text-muted-foreground">Track your learning journey and achievements</p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Games</p>
                    <p className="text-2xl font-bold">{totalGames}</p>
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
                    <p className="text-2xl font-bold">{averageScore}%</p>
                  </div>
                  <Target className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Questions Answered</p>
                    <p className="text-2xl font-bold">{totalQuestions}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">This Week</p>
                    <p className="text-2xl font-bold">{recentGames}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Daily Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dailyStats.length > 0 ? (
                  <ChartContainer config={chartConfig}>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dailyStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey="averageScore"
                          stroke="var(--color-score)"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="games"
                          stroke="var(--color-games)"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Complete more games to see your performance chart</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Accuracy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Overall Accuracy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Accuracy Rate</span>
                    <span className="text-sm font-medium">{accuracyRate}%</span>
                  </div>
                  <Progress value={accuracyRate} className="w-full" />
                  <div className="text-sm text-muted-foreground">
                    Based on {totalGames} completed games
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Questions Answered</span>
                    <span className="text-sm font-medium">{totalQuestions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Games Completed</span>
                    <span className="text-sm font-medium">{totalGames}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Average Score</span>
                    <span className="text-sm font-medium">{averageScore}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {achievements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map((achievement) => achievement && (
                    <div
                      key={achievement.id}
                      className="flex items-center space-x-3 p-4 rounded-lg border bg-card"
                    >
                      <div className="p-2 rounded-full bg-primary/10">
                        <Trophy className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{achievement.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {achievement.description}
                        </p>
                      </div>
                      <Badge variant="secondary">Earned</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <div className="text-center">
                    <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Complete games to unlock achievements</p>
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