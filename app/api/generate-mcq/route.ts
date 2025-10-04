import { NextRequest, NextResponse } from "next/server";
import { callOpenRouter, parseAIJSON } from "@/convex/lib/openrouter";
import { generateSystemPrompt, generateUserPrompt } from "@/convex/lib/aiMcqPrompt";

interface MCQQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface AIResponse {
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const { aiPrompt, difficultyLevel, questionCount } = await request.json();

    console.log("[API] Received request:", { aiPrompt, difficultyLevel, questionCount });

    // Validate inputs
    if (!aiPrompt || aiPrompt.trim().length === 0) {
      console.error("[API] Validation error: AI prompt is required");
      return NextResponse.json({ error: "AI prompt is required" }, { status: 400 });
    }
    if (difficultyLevel < 1 || difficultyLevel > 20) {
      console.error("[API] Validation error: Invalid difficulty level:", difficultyLevel);
      return NextResponse.json(
        { error: "Difficulty level must be between 1 and 20" },
        { status: 400 }
      );
    }
    if (questionCount < 5 || questionCount > 20) {
      console.error("[API] Validation error: Invalid question count:", questionCount);
      return NextResponse.json(
        { error: "Question count must be between 5 and 20" },
        { status: 400 }
      );
    }

    // Get API credentials from environment
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.AI_MCQ_MODEL || "deepseek/deepseek-chat-v3.1:free";

    console.log("[API] Using model:", model);

    if (!apiKey) {
      console.error("[API] OPENROUTER_API_KEY not configured");
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    // Generate prompts
    const systemPrompt = generateSystemPrompt();
    const userPrompt = generateUserPrompt(aiPrompt, difficultyLevel, questionCount);

    console.log("[API] Calling OpenRouter API...");

    // Call OpenRouter API
    const response = await callOpenRouter(
      apiKey,
      model,
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      0.7,
      2500
    );

    console.log("[API] Received AI response, length:", response.length);

    // Parse and validate AI response
    const aiData = parseAIJSON<AIResponse>(response);
    console.log("[API] Parsed AI data, questions count:", aiData.questions?.length);

    if (!aiData.questions || !Array.isArray(aiData.questions)) {
      throw new Error("Invalid AI response: missing questions array");
    }

    // Transform and validate questions
    const questions: MCQQuestion[] = aiData.questions.map((q, index) => {
      if (!q.question || typeof q.question !== "string") {
        throw new Error(`Question ${index + 1} is invalid`);
      }
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        throw new Error(`Question ${index + 1} must have exactly 4 options`);
      }
      if (
        typeof q.correctAnswer !== "number" ||
        q.correctAnswer < 0 ||
        q.correctAnswer > 3
      ) {
        throw new Error(`Question ${index + 1} has invalid correctAnswer`);
      }

      return {
        id: index + 1,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
      };
    });

    console.log("[API] Successfully generated", questions.length, "questions");
    console.log("[API] First question:", questions[0]);

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("[API] Error generating MCQ questions:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate questions",
      },
      { status: 500 }
    );
  }
}
