"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect, use, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { Clock, Users, LogOut, Brain, MessageSquare } from "lucide-react";
import LiveLeaderboard from "../../../_components/LiveLeaderboard";
import { useGameFeedback } from "@/components/GameFeedback";
import { MCQQuestion, MCQQuestionData } from "@/components/mcq/MCQQuestion";
import { MCQResults } from "@/components/mcq/MCQResults";
import { MCQProgress } from "@/components/mcq/MCQProgress";

export default function AIMCQQuizGame({ params }: { params: Promise<{ code: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const gameCode = resolvedParams.code.toUpperCase();

  const currentUser = useQuery(api.users.getCurrentUser);
  const gameInstance = useQuery(api.games.getGameInstanceByCode, { code: gameCode });
  const gameQuestions = useQuery(api.games.getGameQuestions, { code: gameCode });
  const gameProgress = useQuery(api.games.getGameProgress, { gameCode });
  const updateGameProgress = useMutation(api.games.updateGameProgress);
  const completeGame = useMutation(api.games.completeGame);
  const exitGame = useMutation(api.games.exitGame);

  const [questions, setQuestions] = useState<MCQQuestionData[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // Default 5 minutes, will be updated from config
  const [score, setScore] = useState(0);
  const [guestName] = useState<string | null>(null);

  // Game feedback
  const { triggerFeedback } = useGameFeedback(
    currentUser?.soundFeedback ?? true,
    currentUser?.hapticFeedback ?? true
  );

  // Set time limit from game instance config
  useEffect(() => {
    if (gameInstance?.customConfig?.timeLimit) {
      setTimeLeft(gameInstance.customConfig.timeLimit);
    }
  }, [gameInstance]);

  // Load questions from the database
  useEffect(() => {
    if (gameQuestions && Array.isArray(gameQuestions)) {
      setQuestions(gameQuestions);
      setUserAnswers(new Array(gameQuestions.length).fill(null));
    }
  }, [gameQuestions]);

  // Restore progress from database
  useEffect(() => {
    if (!gameProgress || !questions.length) return;

    const userProgress = gameProgress.find((progress: any) => {
      if (currentUser) {
        return progress.participantId === currentUser._id;
      } else {
        return progress.participantType === "guest" && progress.participantName === (guestName || "Guest Player");
      }
    });

    if (userProgress) {
      if (userProgress.isCompleted === true) {
        if (!gameFinished) {
          setScore(userProgress.score);
          setGameFinished(true);
        }
        if (!gameStarted) {
          setGameStarted(true);
        }
        return;
      }

      if (userProgress.questionsAnswered > 0 && !gameStarted) {
        if (userProgress.questionsAnswered > currentQuestionIndex) {
          setCurrentQuestionIndex(userProgress.questionsAnswered);
          setScore(userProgress.score);
        }

        if (userProgress.questionsAnswered >= questions.length) {
          setGameFinished(true);
        }

        setGameStarted(true);
      } else if (!gameStarted && !gameFinished) {
        setGameStarted(true);
      }
    } else if (!gameStarted && !gameFinished) {
      setGameStarted(true);
    }
  }, [gameProgress, currentUser, questions.length, guestName, gameStarted, currentQuestionIndex, gameFinished]);

  // Update progress in database
  useEffect(() => {
    if (gameStarted && questions.length > 0 && (currentUser || guestName)) {
      updateGameProgress({
        gameCode,
        questionsAnswered: Math.max(0, currentQuestionIndex),
        totalQuestions: questions.length,
        score: score,
        guestName: !currentUser ? (guestName || "Guest Player") : undefined,
      }).catch(console.error);
    }
  }, [currentQuestionIndex, gameStarted, questions, gameCode, currentUser, guestName, updateGameProgress, score]);

  const calculateFinalScore = useCallback(
    async (answers: (number | null)[]) => {
      let correctAnswers = 0;
      questions.forEach((question, index) => {
        if (answers[index] === question.correctAnswer) {
          correctAnswers++;
        }
      });
      setScore(correctAnswers);

      try {
        await completeGame({
          gameCode,
          finalScore: correctAnswers,
          totalQuestions: questions.length,
          completedAt: Date.now(),
          guestName: !currentUser ? (guestName || "Guest Player") : undefined,
        });
      } catch (error) {
        console.error("Failed to mark game as completed:", error);
      }

      return correctAnswers;
    },
    [questions, completeGame, gameCode, currentUser, guestName]
  );

  // Timer logic
  useEffect(() => {
    if (gameStarted && !gameFinished && gameInstance?.gameStartedAt) {
      const timer = setInterval(() => {
        const gameStartTime = gameInstance.gameStartedAt!;
        const maxTime = 600000; // 10 minutes in milliseconds
        const elapsedTime = Date.now() - gameStartTime;
        const remaining = Math.max(0, Math.ceil((maxTime - elapsedTime) / 1000));

        setTimeLeft(remaining);

        if (remaining <= 0) {
          calculateFinalScore(userAnswers).then(() => {
            setGameFinished(true);
          });
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameStarted, gameFinished, gameInstance?.gameStartedAt, userAnswers, calculateFinalScore]);

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = async () => {
    if (selectedAnswer === null) return;

    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = selectedAnswer;
    setUserAnswers(newAnswers);

    // Trigger feedback
    const isCorrect = selectedAnswer === questions[currentQuestionIndex]?.correctAnswer;
    triggerFeedback(isCorrect);

    const currentScore = newAnswers.filter((ans, index) => ans === questions[index]?.correctAnswer).length;
    setScore(currentScore);

    // Save progress
    try {
      await updateGameProgress({
        gameCode,
        questionsAnswered: currentQuestionIndex + 1,
        totalQuestions: questions.length,
        score: currentScore,
        guestName: !currentUser ? (guestName || "Guest Player") : undefined,
      });
    } catch (error) {
      console.error("Failed to save progress:", error);
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      await calculateFinalScore(newAnswers);
      setGameFinished(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Loading state
  if (currentUser === undefined || gameInstance === undefined || gameQuestions === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Game not found
  if (!gameInstance) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Game Not Found</h1>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Game finished - show results
  if (gameFinished) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">AI MCQ Quiz - Results</h1>
            <p className="text-muted-foreground">Code: {gameCode}</p>
            {gameInstance.customConfig && (
              <p className="text-sm text-muted-foreground">
                Topic: {gameInstance.customConfig.topic} | Difficulty: {gameInstance.customConfig.difficultyLevel}/20
              </p>
            )}
          </div>

          <MCQResults questions={questions} userAnswers={userAnswers} score={score} />

          <div className="mt-6">
            <LiveLeaderboard gameCode={gameCode} />
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={() => window.location.reload()} className="flex-1">
              Play Again
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/feedback">
                <MessageSquare className="h-4 w-4 mr-2 inline" />
                Feedback
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Game in progress
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6" />
              AI MCQ Quiz
            </h1>
            <p className="text-muted-foreground">Code: {gameCode}</p>
            {gameInstance.customConfig && (
              <p className="text-sm text-muted-foreground">
                Topic: {gameInstance.customConfig.topic} | Difficulty: {gameInstance.customConfig.difficultyLevel}/20
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>{gameInstance.participants?.length || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                await exitGame({
                  gameCode,
                  guestName: !currentUser ? (guestName || "Guest Player") : undefined,
                });
                router.push("/dashboard");
              }}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Exit</span>
            </Button>
          </div>
        </div>

        {/* Progress */}
        <MCQProgress currentQuestion={currentQuestionIndex} totalQuestions={questions.length} className="mb-8" />

        {/* Question */}
        {currentQuestion && (
          <div className="mb-6">
            <MCQQuestion
              question={currentQuestion}
              selectedAnswer={selectedAnswer}
              onAnswerSelect={handleAnswerSelect}
              disabled={false}
            />
          </div>
        )}

        {/* Next Button */}
        <div className="flex justify-center mb-8">
          <Button onClick={handleNextQuestion} disabled={selectedAnswer === null} size="lg" className="px-12">
            {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
          </Button>
        </div>

        {/* Live Leaderboard */}
        <LiveLeaderboard gameCode={gameCode} />
      </div>
    </div>
  );
}
