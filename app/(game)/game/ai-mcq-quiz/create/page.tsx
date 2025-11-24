"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Loader } from "@/components/ui/loader";
import { Brain, Sparkles, AlertCircle, Clock, Hash, Globe } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LANGUAGES = [
  { value: "English", label: "English" },
  { value: "Hindi", label: "Hindi" },
  { value: "Tamil", label: "Tamil" },
  { value: "Telugu", label: "Telugu" },
  { value: "Kannada", label: "Kannada" },
  { value: "Malayalam", label: "Malayalam" },
  { value: "Bengali", label: "Bengali" },
  { value: "Marathi", label: "Marathi" },
  { value: "Gujarati", label: "Gujarati" },
  { value: "Punjabi", label: "Punjabi" },
  { value: "Urdu", label: "Urdu" },
];

const DIFFICULTY_DESCRIPTIONS: Record<number, string> = {
  1: "1st Grade",
  2: "2nd Grade",
  3: "3rd Grade",
  4: "4th Grade",
  5: "5th Grade",
  6: "6th Grade (Middle School)",
  7: "7th Grade (Middle School)",
  8: "8th Grade (Middle School)",
  9: "9th Grade (High School)",
  10: "10th Grade (High School)",
  11: "11th Grade (High School)",
  12: "12th Grade (High School)",
  13: "1st Year University",
  14: "2nd Year University",
  15: "3rd Year University",
  16: "4th Year University",
  17: "Graduate/Masters Level",
  18: "Graduate/Masters Level",
  19: "Postdoc/Expert Level",
  20: "Postdoc/Expert Level",
};

export default function CreateAIMCQQuiz() {
  const router = useRouter();
  const createGameInstance = useMutation(api.games.createGameInstance);

  const [quizTitle, setQuizTitle] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState([10]); // Default to 10th grade
  const [questionCount, setQuestionCount] = useState([10]); // Default to 10 questions
  const [timeLimit, setTimeLimit] = useState([300]); // Default to 5 minutes total
  const [language, setLanguage] = useState("English");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs === 0 ? `${mins}m` : `${mins}m ${secs}s`;
  };

  const handleCreate = async () => {
    if (!quizTitle.trim()) {
      setError("Please enter a quiz title");
      return;
    }

    if (!aiPrompt.trim()) {
      setError("Please enter an AI prompt");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      console.log("Step 1: Generating questions via API endpoint...");
      console.log("Request:", { quizTitle: quizTitle.trim(), aiPrompt: aiPrompt.trim(), difficultyLevel: difficultyLevel[0], questionCount: questionCount[0], language });

      // Step 1: Generate questions via API endpoint
      const generateResponse = await fetch("/api/generate-mcq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiPrompt: aiPrompt.trim(),
          difficultyLevel: difficultyLevel[0],
          questionCount: questionCount[0],
          language,
        }),
      });

      console.log("API Response Status:", generateResponse.status);

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.error || "Failed to generate questions");
      }

      const { questions } = await generateResponse.json();
      console.log("Step 2: Questions generated successfully:", questions.length, "questions");
      console.log("First question:", questions[0]);

      // Step 2: Create game instance with generated questions
      console.log("Step 3: Creating game instance...");
      const result = await createGameInstance({
        gameId: "ai-mcq-quiz",
        customConfig: {
          questionCount: questionCount[0],
          timeLimit: timeLimit[0],
          language,
          questions, // Include the AI-generated questions
        },
      });

      console.log("Step 4: Game instance created successfully:", result);
      console.log("Navigating to room:", result.code);

      // Navigate to the game room
      router.push(`/room/${result.code}`);
    } catch (err) {
      console.error("Error creating AI MCQ quiz:", err);
      setError(err instanceof Error ? err.message : "Failed to create quiz. Please try again.");
      setIsCreating(false);
    }
  };

  if (isCreating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <Sparkles className="h-12 w-12 mx-auto animate-pulse text-primary" />
            <h2 className="text-2xl font-bold">Generating Your Quiz...</h2>
            <p className="text-muted-foreground">
              Our AI is creating {questionCount[0]} questions for "{quizTitle}" at difficulty level{" "}
              {difficultyLevel[0]}/20.
            </p>
            <p className="text-sm text-muted-foreground">This may take a few moments.</p>
            <div className="flex justify-center">
              <Loader />
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
              <Brain className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl">Create AI MCQ Quiz</CardTitle>
            </div>
            <CardDescription>
              Create a custom multiple-choice quiz on any topic using AI. Perfect for testing
              knowledge across all difficulty levels!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Quiz Title Input */}
            <div className="space-y-2">
              <Label htmlFor="quizTitle">Quiz Title</Label>
              <Input
                id="quizTitle"
                placeholder="e.g., World War II History, Advanced Calculus, Python Basics"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                className="text-lg"
              />
              <p className="text-sm text-muted-foreground">
                Give your quiz a descriptive title.
              </p>
            </div>

            {/* AI Prompt Input */}
            <div className="space-y-2">
              <Label htmlFor="aiPrompt">AI Prompt</Label>
              <Textarea
                id="aiPrompt"
                placeholder="e.g., Generate questions about photosynthesis focusing on the light-dependent reactions and Calvin cycle. Include questions about chloroplast structure and the role of ATP and NADPH."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="min-h-[120px] resize-none"
              />
              <p className="text-sm text-muted-foreground">
                Describe what you want the AI to generate questions about. Be as specific as possible for better results.
              </p>
            </div>

            {/* Language Selection */}
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Select the language for the questions and answers.
              </p>
            </div>

            {/* Difficulty Level Slider */}
            <div className="space-y-4">
              <div>
                <Label>Difficulty Level: {difficultyLevel[0]}/20</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {DIFFICULTY_DESCRIPTIONS[difficultyLevel[0]]}
                </p>
              </div>
              <Slider
                value={difficultyLevel}
                onValueChange={setDifficultyLevel}
                min={1}
                max={20}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 (1st Grade)</span>
                <span>10 (High School)</span>
                <span>20 (Expert)</span>
              </div>
            </div>

            {/* Question Count Slider */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Hash className="h-5 w-5 text-muted-foreground" />
                <Label>Number of Questions: {questionCount[0]}</Label>
              </div>
              <Slider
                value={questionCount}
                onValueChange={setQuestionCount}
                min={5}
                max={20}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5 questions</span>
                <span>20 questions</span>
              </div>
            </div>

            {/* Time Limit Slider */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <Label>Time Limit: {formatTime(timeLimit[0])}</Label>
              </div>
              <Slider
                value={timeLimit}
                onValueChange={setTimeLimit}
                min={60}
                max={600}
                step={30}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1m</span>
                <span>10m</span>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI-Powered Quiz Generation
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Questions are generated based on your topic and difficulty level</li>
                <li>• Supports LaTeX formatting for mathematical expressions</li>
                <li>• Available in multiple Indian languages</li>
                <li>• Each question has 4 options with only one correct answer</li>
                <li>• This is a multiplayer game - invite friends to compete!</li>
              </ul>
            </div>

            {/* Create Button */}
            <div className="flex gap-3">
              <Button onClick={handleCreate} className="flex-1" size="lg" disabled={isCreating}>
                <Brain className="h-5 w-5 mr-2" />
                Generate Quiz with AI
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/dashboard">Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
