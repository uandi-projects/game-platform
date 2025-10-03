"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useState, useEffect, use, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader } from "@/components/ui/loader";
import { Trophy, Clock, CheckCircle, XCircle, LogOut, MessageSquare } from "lucide-react";
import { useGameFeedback } from "@/components/GameFeedback";

interface Question {
  id: number;
  question: string;
  answer: number;
}

export default function CustomMathQuiz({ params }: { params: Promise<{ code: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const gameCode = resolvedParams.code.toUpperCase();

  const currentUser = useQuery(api.users.getCurrentUser);
  const gameInstance = useQuery(api.games.getGameInstanceByCode, { code: gameCode });
  const gameQuestions = useQuery(api.games.getGameQuestions, { code: gameCode });
  const gameProgress = useQuery(api.games.getGameProgress, { gameCode });
  const updateGameProgress = useMutation(api.games.updateGameProgress);
  const startSinglePlayerGame = useMutation(api.games.startSinglePlayerGame);
  const completeGame = useMutation(api.games.completeGame);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // Default 5 minutes
  const [score, setScore] = useState(0);
  const [guestName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Game feedback
  const { triggerFeedback } = useGameFeedback(
    currentUser?.soundFeedback ?? true,
    currentUser?.hapticFeedback ?? true
  );

  // Get custom config from game instance
  const customConfig = gameInstance?.customConfig as { timeLimit: number; questionCount: number } | undefined;
  const timeLimit = customConfig?.timeLimit || 300;

  // Load questions from the database
  useEffect(() => {
    if (gameQuestions && Array.isArray(gameQuestions)) {
      setQuestions(gameQuestions);
    }
  }, [gameQuestions]);

  // Restore progress from database and check completion status
  useEffect(() => {
    if (!gameProgress || !questions.length || !gameInstance) return;

    // Find current user's progress record
    const userProgress = gameProgress.find((progress: any) => {
      if (currentUser) {
        return progress.participantId === currentUser._id;
      } else {
        return progress.participantType === 'guest' && progress.participantName === (guestName || "Guest Player");
      }
    });

    if (userProgress) {
      // Check if game is already completed - MUST CHECK THIS FIRST
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

      // Restore progress if exists
      if (userProgress.questionsAnswered > 0 && !gameStarted) {
        // Restore game state from database
        const nextQuestionIndex = Math.min(userProgress.questionsAnswered, questions.length - 1);
        setCurrentQuestionIndex(nextQuestionIndex);
        setScore(userProgress.score);

        // If user completed all questions, mark as finished
        if (userProgress.questionsAnswered >= questions.length) {
          setGameFinished(true);
        }

        // Set game as started if progress exists
        setGameStarted(true);
      } else if (!gameStarted && !gameFinished) {
        // No progress yet, auto-start the game
        if (gameInstance.gameStartedAt) {
          setGameStarted(true);
        } else {
          // Start the game immediately for single-player
          startSinglePlayerGame({ code: gameCode })
            .then(() => {
              setGameStarted(true);
            })
            .catch(console.error);
        }
      }
    } else if (!gameStarted && !gameFinished) {
      // No progress record, auto-start the game
      if (gameInstance.gameStartedAt) {
        setGameStarted(true);
      } else {
        // Start the game immediately for single-player
        startSinglePlayerGame({ code: gameCode })
          .then(() => {
            setGameStarted(true);
          })
          .catch(console.error);
      }
    }
  }, [gameProgress, currentUser, questions.length, guestName, gameStarted, currentQuestionIndex, gameFinished, gameInstance, gameCode, startSinglePlayerGame]);

  // Update progress in database
  useEffect(() => {
    if (gameStarted && questions.length > 0 && currentUser) {
      // Use the current score directly (it's maintained separately from fake answers)
      updateGameProgress({
        gameCode,
        questionsAnswered: Math.max(0, currentQuestionIndex),
        totalQuestions: questions.length,
        score: score,
        guestName: undefined, // Single-player authenticated users don't need guestName
      }).catch(console.error);
    }
  }, [currentQuestionIndex, gameStarted, questions, gameCode, currentUser, updateGameProgress, score]);

  // Timer logic - synchronized with game start time
  useEffect(() => {
    if (gameStarted && !gameFinished && gameInstance?.gameStartedAt) {
      const timer = setInterval(() => {
        const gameStartTime = gameInstance.gameStartedAt!;
        const maxTime = timeLimit * 1000; // Custom time limit in milliseconds
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
  }, [gameStarted, gameFinished, gameInstance?.gameStartedAt, userAnswers, timeLimit]);

  const calculateFinalScore = async (answers: number[]) => {
    let correctAnswers = 0;
    questions.forEach((question, index) => {
      if (answers[index] === question.answer) {
        correctAnswers++;
      }
    });
    setScore(correctAnswers);

    // Mark game as completed on server
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
  };

  const handleAnswerSubmit = async () => {
    const answer = parseInt(currentAnswer);
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
    setCurrentAnswer("");

    // Trigger feedback for the answer
    const isCorrect = answer === questions[currentQuestionIndex]?.answer;
    triggerFeedback(isCorrect);

    const newQuestionIndex = currentQuestionIndex + 1;
    const currentScore = newAnswers.filter((ans, index) => ans === questions[index]?.answer).length;

    // Update local score state immediately
    setScore(currentScore);

    // Immediately save progress to database
    try {
      await updateGameProgress({
        gameCode,
        questionsAnswered: newQuestionIndex,
        totalQuestions: questions.length,
        score: currentScore,
        guestName: !currentUser ? (guestName || "Guest Player") : undefined,
      });
    } catch (error) {
      console.error("Failed to save progress:", error);
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(newQuestionIndex);
    } else {
      // Calculate final score with the completed answers
      await calculateFinalScore(newAnswers);
      setGameFinished(true);
    }
  };

  // Focus input when question changes
  useEffect(() => {
    if (gameStarted && !gameFinished && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentQuestionIndex, gameStarted, gameFinished]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  // Game loading/starting - show loading state instead of waiting room
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader />
          <p className="mt-4 text-muted-foreground">Starting your custom math quiz...</p>
        </div>
      </div>
    );
  }

  // Game finished
  if (gameFinished) {
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{score}/{questions.length}</div>
              <div className="text-lg text-muted-foreground">Correct Answers</div>
              <div className="text-2xl font-semibold mt-2">{percentage}%</div>
            </div>

            {userAnswers.length > 0 ? (
              <div className="space-y-2">
                <h3 className="font-semibold">Results:</h3>
                {questions.map((question, index) => {
                  const userAnswer = userAnswers[index];
                  const isCorrect = userAnswer !== undefined && userAnswer === question.answer;

                  return (
                    <div key={question.id} className="flex items-center justify-between p-2 rounded border">
                      <span>{question.question} = ?</span>
                      <div className="flex items-center gap-2">
                        <span className={isCorrect ? "text-green-600" : "text-red-600"}>
                          {userAnswer !== undefined ? userAnswer : "No answer"}
                        </span>
                        {isCorrect ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        {!isCorrect && (
                          <span className="text-sm text-muted-foreground">
                            (Correct: {question.answer})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-6 bg-muted rounded-lg">
                <p className="text-muted-foreground">
                  Quiz completed in a previous session. Individual answers not available.
                </p>
              </div>
            )}

            <div className="flex gap-2">
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
          </CardContent>
        </Card>
      </div>
    );
  }

  // Game in progress
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Custom Math Quiz</h1>
            <p className="text-muted-foreground">Code: {gameCode}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Exit</span>
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question */}
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="text-4xl font-bold">
                {currentQuestion?.question} = ?
              </div>

              <div className="max-w-xs mx-auto">
                <input
                  ref={inputRef}
                  type="number"
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  className="w-full text-center text-2xl p-4 border rounded-lg"
                  placeholder="Your answer"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && currentAnswer.trim()) {
                      handleAnswerSubmit();
                    }
                  }}
                />
              </div>

              <Button
                onClick={handleAnswerSubmit}
                disabled={!currentAnswer.trim()}
                className="px-8"
              >
                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}