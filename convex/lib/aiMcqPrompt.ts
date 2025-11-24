// AI MCQ Question Generation Prompt Template

/**
 * Generates a system prompt for AI MCQ question generation
 */
export function generateSystemPrompt(): string {
  return `You are an expert educational content creator specializing in generating high-quality multiple-choice questions (MCQs).

Your task is to generate MCQs that are:
1. Academically rigorous and appropriate for the specified difficulty level
2. Clear, unambiguous, and well-structured
3. Educational and designed to test understanding, not just memorization
4. Free from cultural bias or offensive content

You can use LaTeX formatting for mathematical expressions. Use $ for inline math (e.g., $x^2$) and $$ for display math (e.g., $$\\frac{a}{b}$$).

IMPORTANT: You MUST respond ONLY with valid JSON in the exact format specified. Do not include any explanatory text before or after the JSON.`;
}

/**
 * Difficulty level descriptions for better AI context
 */
export function getDifficultyDescription(level: number): string {
  if (level >= 1 && level <= 5) {
    return `elementary school (grades ${level}, ages ${5 + level}-${6 + level}). Questions should use simple vocabulary and concepts appropriate for young children.`;
  } else if (level >= 6 && level <= 8) {
    return `middle school (grades ${level}, ages ${10 + level}-${11 + level}). Questions should introduce more complex concepts while remaining accessible.`;
  } else if (level >= 9 && level <= 12) {
    return `high school (grades ${level}, ages ${13 + level}-${14 + level}). Questions should be challenging and prepare students for higher education.`;
  } else if (level >= 13 && level <= 16) {
    const year = level - 12;
    return `university level (year ${year}). Questions should be academically rigorous, testing deep understanding and application of concepts.`;
  } else if (level >= 17 && level <= 18) {
    return `graduate/masters level. Questions should require advanced knowledge, critical thinking, and synthesis of complex ideas.`;
  } else if (level >= 19 && level <= 20) {
    return `postdoctoral/expert level. Questions should be at the cutting edge of the field, suitable for researchers and domain experts.`;
  }
  return "appropriate difficulty level";
}

/**
 * Generates the user prompt for MCQ generation
 */
export function generateUserPrompt(
  aiPrompt: string,
  difficultyLevel: number,
  questionCount: number,
  language: string = "English"
): string {
  const difficultyDesc = getDifficultyDescription(difficultyLevel);

  return `Generate exactly ${questionCount} multiple-choice questions based on the following instructions at difficulty level ${difficultyLevel}/20.

User Instructions: ${aiPrompt}

Difficulty level context: This is ${difficultyDesc}

Language Requirement: The questions and answers MUST be in ${language}. However, the JSON keys (question, options, correctAnswer) MUST remain in English.

Requirements for each question:
- Must have exactly 4 answer options (A, B, C, D)
- Only ONE option should be correct
- All incorrect options (distractors) should be plausible but clearly wrong
- Questions can include LaTeX math notation using $ or $$ delimiters
- Questions should test understanding, not just recall
- Follow the user's instructions about what content to cover
- Ensure the content is in ${language}

Return ONLY valid JSON in this EXACT format (no additional text):
{
  "questions": [
    {
      "question": "Your question text here (can include $LaTeX$ like $x^2 + y^2 = z^2$)",
      "options": [
        "Option A text (can include $LaTeX$)",
        "Option B text (can include $LaTeX$)",
        "Option C text (can include $LaTeX$)",
        "Option D text (can include $LaTeX$)"
      ],
      "correctAnswer": 0
    }
  ]
}

The "correctAnswer" field must be an integer from 0-3 (0 for A, 1 for B, 2 for C, 3 for D).`;
}
