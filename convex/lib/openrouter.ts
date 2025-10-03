// OpenRouter API integration utility

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call OpenRouter API with the specified model and messages
 */
export async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: OpenRouterMessage[],
  temperature: number = 0.7,
  maxTokens: number = 2000
): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
      "X-Title": "Game Platform - AI MCQ Generator",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data: OpenRouterResponse = await response.json();

  if (!data.choices || data.choices.length === 0) {
    throw new Error("No response from OpenRouter API");
  }

  return data.choices[0].message.content;
}

/**
 * Parse JSON from AI response, handling markdown code blocks
 */
export function parseAIJSON<T>(content: string): T {
  // Remove markdown code blocks if present
  let jsonString = content.trim();

  // Remove ```json ... ``` or ``` ... ``` wrappers
  if (jsonString.startsWith("```")) {
    const lines = jsonString.split("\n");
    if (lines[0].trim() === "```json" || lines[0].trim() === "```") {
      lines.shift(); // Remove first line
    }
    if (lines[lines.length - 1].trim() === "```") {
      lines.pop(); // Remove last line
    }
    jsonString = lines.join("\n");
  }

  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    throw new Error(`Failed to parse AI response as JSON: ${error}`);
  }
}
