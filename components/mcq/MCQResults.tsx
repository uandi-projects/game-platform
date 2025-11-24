"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CheckCircle, XCircle, Trophy, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

// ... (existing code)


import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

export interface MCQQuestionData {
  id: number;
  question: string;
  options: string[];
  optionDescriptions?: string[];
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

function MCQOptionResult({
  option,
  optionIndex,
  userAnswer,
  correctAnswer,
  description,
  optionLabel
}: {
  option: string;
  optionIndex: number;
  userAnswer: number | null;
  correctAnswer: number;
  description?: string;
  optionLabel: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isUserAnswer = userAnswer === optionIndex;
  const isCorrectAnswer = optionIndex === correctAnswer;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={`rounded border ${isCorrectAnswer
          ? "bg-green-100 border-green-500"
          : isUserAnswer
            ? "bg-red-100 border-red-500"
            : "bg-gray-50 border-gray-200"
        }`}
    >
      <div className="p-2 flex items-start">
        <span className="font-semibold mr-2 mt-0.5">{optionLabel}. </span>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {renderLatex(option)}
              {isCorrectAnswer && (
                <span className="ml-2 text-green-700 font-semibold text-sm">
                  ✓ Correct Answer
                </span>
              )}
              {isUserAnswer && !isCorrectAnswer && (
                <span className="ml-2 text-red-700 font-semibold text-sm">
                  ✗ Your Answer
                </span>
              )}
            </div>

            {description && (
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-transparent">
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                  <span className="sr-only">Toggle explanation</span>
                </Button>
              </CollapsibleTrigger>
            )}
          </div>

          {description && (
            <CollapsibleContent className="mt-2 text-sm border-t border-black/10 pt-2">
              <div className={`${isCorrectAnswer
                  ? "text-green-800"
                  : isUserAnswer
                    ? "text-red-800"
                    : "text-muted-foreground"
                }`}>
                {renderLatex(description)}
              </div>
            </CollapsibleContent>
          )}
        </div>
      </div>
    </Collapsible>
  );
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
                        {question.options.map((option, optionIndex) => (
                          <MCQOptionResult
                            key={optionIndex}
                            option={option}
                            optionIndex={optionIndex}
                            userAnswer={userAnswer}
                            correctAnswer={question.correctAnswer}
                            description={question.optionDescriptions?.[optionIndex]}
                            optionLabel={optionLabels[optionIndex]}
                          />
                        ))}
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
