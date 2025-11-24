"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

export interface MCQQuestionData {
  id: number;
  question: string;
  options: string[];
  optionDescriptions?: string[];
  correctAnswer: number;
}

interface MCQQuestionProps {
  question: MCQQuestionData;
  selectedAnswer: number | null;
  onAnswerSelect: (answerIndex: number) => void;
  showResult?: boolean;
  disabled?: boolean;
}

/**
 * Render text with LaTeX support
 * Supports inline math $...$ and display math $$...$$
 */
function renderLatex(text: string) {
  // Split by display math ($$...$$) first
  const displayParts = text.split(/(\$\$.*?\$\$)/g);

  return displayParts.map((part, idx) => {
    if (part.startsWith("$$") && part.endsWith("$$")) {
      // Display math
      const math = part.slice(2, -2);
      return <BlockMath key={idx} math={math} />;
    }

    // Split by inline math ($...$)
    const inlineParts = part.split(/(\$.*?\$)/g);
    return inlineParts.map((inlinePart, inlineIdx) => {
      if (inlinePart.startsWith("$") && inlinePart.endsWith("$") && !inlinePart.startsWith("$$")) {
        // Inline math
        const math = inlinePart.slice(1, -1);
        return <InlineMath key={`${idx}-${inlineIdx}`} math={math} />;
      }
      return inlinePart;
    });
  });
}

export function MCQQuestion({
  question,
  selectedAnswer,
  onAnswerSelect,
  showResult = false,
  disabled = false,
}: MCQQuestionProps) {
  const optionLabels = ["A", "B", "C", "D"];

  return (
    <Card>
      <CardContent className="p-8">
        <div className="space-y-6">
          {/* Question */}
          <div className="text-xl font-semibold leading-relaxed">
            {renderLatex(question.question)}
          </div>

          {/* Options */}
          <div className="space-y-3">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === question.correctAnswer;
              const showCorrect = showResult && isCorrect;
              const showIncorrect = showResult && isSelected && !isCorrect;

              return (
                <Button
                  key={index}
                  onClick={() => onAnswerSelect(index)}
                  disabled={disabled}
                  variant={isSelected ? "default" : "outline"}
                  className={`w-full justify-start text-left h-auto py-4 px-4 ${showCorrect
                      ? "bg-green-100 border-green-500 text-green-900 hover:bg-green-100"
                      : showIncorrect
                        ? "bg-red-100 border-red-500 text-red-900 hover:bg-red-100"
                        : ""
                    }`}
                >
                  <div className="flex items-center gap-3 w-full">
                    <span className="font-bold min-w-[24px]">{optionLabels[index]}.</span>
                    <span className="flex-1">{renderLatex(option)}</span>
                    {showCorrect && <CheckCircle className="h-5 w-5 text-green-600" />}
                    {showIncorrect && <XCircle className="h-5 w-5 text-red-600" />}
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
