"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Loader } from "@/components/ui/loader";
import { Settings, Clock, Hash } from "lucide-react";
import Link from "next/link";

export default function CustomMathQuizCreate() {
  const router = useRouter();
  const currentUser = useQuery(api.users.getCurrentUser);
  const createGameInstance = useMutation(api.games.createGameInstance);

  const [timeLimit, setTimeLimit] = useState([300]); // 5 minutes default
  const [questionCount, setQuestionCount] = useState([10]); // 10 questions default
  const [isCreating, setIsCreating] = useState(false);

  if (currentUser === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!currentUser) {
    router.push("/signin");
    return null;
  }

  const handleCreateGame = async () => {
    setIsCreating(true);
    try {
      const customConfig = {
        timeLimit: timeLimit[0],
        questionCount: questionCount[0],
      };

      const instance = await createGameInstance({
        gameId: "custom-math-quiz",
        customConfig,
      });

      // Redirect directly to the game (single-player starts immediately)
      router.push(`/game/custom-math-quiz/${instance.code}`);
    } catch (error) {
      console.error("Failed to create custom game:", error);
      alert("Failed to create game. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs === 0 ? `${mins}m` : `${mins}m ${secs}s`;
  };

  return (
    <div className="min-h-screen bg-background p-8 flex items-center justify-center">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Settings className="h-12 w-12 text-blue-500" />
          </div>
          <CardTitle className="text-2xl">Create Custom Math Quiz</CardTitle>
          <p className="text-muted-foreground">
            Customize your math quiz settings
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Time Limit Setting */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <Label className="text-base font-medium">Time Limit</Label>
            </div>
            <div className="px-3">
              <Slider
                value={timeLimit}
                onValueChange={setTimeLimit}
                max={600}
                min={60}
                step={30}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>1m</span>
                <span className="font-medium text-foreground">
                  {formatTime(timeLimit[0])}
                </span>
                <span>10m</span>
              </div>
            </div>
          </div>

          {/* Question Count Setting */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-muted-foreground" />
              <Label className="text-base font-medium">Number of Questions</Label>
            </div>
            <div className="px-3">
              <Slider
                value={questionCount}
                onValueChange={setQuestionCount}
                max={20}
                min={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>5</span>
                <span className="font-medium text-foreground">
                  {questionCount[0]} questions
                </span>
                <span>20</span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-muted rounded-lg p-4">
            <h3 className="font-medium mb-2">Quiz Summary:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• {questionCount[0]} math questions (addition & subtraction)</li>
              <li>• {formatTime(timeLimit[0])} to complete</li>
              <li>• Single-player mode</li>
              <li>• Random number generation</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              asChild
            >
              <Link href="/dashboard">Cancel</Link>
            </Button>
            <Button
              onClick={handleCreateGame}
              disabled={isCreating}
              className="flex-1"
            >
              {isCreating ? (
                <>
                  <Loader className="mr-2 h-4 w-4" />
                  Creating...
                </>
              ) : (
                "Create & Start Quiz"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}