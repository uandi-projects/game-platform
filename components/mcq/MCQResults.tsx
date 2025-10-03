"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Trophy } from "lucide-react";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

export interface MCQQuestionData {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface MCQResultsProps {
  questions: MCQQuestionData[];
  userAnswers: (number | null)[];
  score: number;
}

/**
 * Render text with LaTeX support
 */
function renderLatex(text: string) {
  const displayParts = text.split(/(\$\$.*?\$\$)/g);

  return displayParts.map((part, idx) => {
    if (part.startsWith("$$") && part.endsWith("$$")) {
      const math = part.slice(2, -2);
      return <BlockMath key={idx} math={math} />;
    }

    const inlineParts = part.split(/(\$.*?\$)/g);
    return inlineParts.map((inlinePart, inlineIdx) => {
      if (inlinePart.startsWith("$") && inlinePart.endsWith("$") && !inlinePart.startsWith("$$")) {
        const math = inlinePart.slice(1, -1);
        return <InlineMath key={`${idx}-${inlineIdx}`} math={math} />;
      }
      return inlinePart;
    });
  });
}

export function MCQResults({ questions, userAnswers, score }: MCQResultsProps) {
  const percentage = Math.round((score / questions.length) * 100);
  const optionLabels = ["A", "B", "C", "D"];

  return (
    <div className="space-y-6">
      {/* Score Summary */}
      <Card>
        <CardHeader className="text-center">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
          <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-4xl font-bold mb-2">
            {score}/{questions.length}
          </div>
          <div className="text-lg text-muted-foreground">Correct Answers</div>
          <div className="text-2xl font-semibold mt-2">{percentage}%</div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Review Your Answers</h3>
        {questions.map((question, index) => {
          const userAnswer = userAnswers[index];
          const isCorrect = userAnswer !== null && userAnswer === question.correctAnswer;

          return (
            <Card key={question.id} className="border-2">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Question Header */}
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {isCorrect ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold mb-2">
                        Question {index + 1}: {renderLatex(question.question)}
                      </div>

                      {/* Options */}
                      <div className="space-y-2 ml-4">
                        {question.options.map((option, optionIndex) => {
                          const isUserAnswer = userAnswer === optionIndex;
                          const isCorrectAnswer = optionIndex === question.correctAnswer;

                          return (
                            <div
                              key={optionIndex}
                              className={`p-2 rounded ${
                                isCorrectAnswer
                                  ? "bg-green-100 border border-green-500"
                                  : isUserAnswer
                                  ? "bg-red-100 border border-red-500"
                                  : "bg-gray-50"
                              }`}
                            >
                              <span className="font-semibold">{optionLabels[optionIndex]}. </span>
                              {renderLatex(option)}
                              {isCorrectAnswer && (
                                <span className="ml-2 text-green-700 font-semibold">
                                  ✓ Correct Answer
                                </span>
                              )}
                              {isUserAnswer && !isCorrectAnswer && (
                                <span className="ml-2 text-red-700 font-semibold">
                                  ✗ Your Answer
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* No Answer Given */}
                      {userAnswer === null && (
                        <div className="mt-2 text-sm text-muted-foreground italic">
                          No answer provided
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
