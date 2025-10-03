"use client";

import { Progress } from "@/components/ui/progress";

interface MCQProgressProps {
  currentQuestion: number;
  totalQuestions: number;
  className?: string;
}

export function MCQProgress({
  currentQuestion,
  totalQuestions,
  className = "",
}: MCQProgressProps) {
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  return (
    <div className={className}>
      <div className="flex justify-between text-sm mb-2">
        <span>
          Question {currentQuestion + 1} of {totalQuestions}
        </span>
        <span>{Math.round(progress)}% Complete</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
