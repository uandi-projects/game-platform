// Multi Player Math game question generation

export interface Question {
  id: number;
  question: string;
  answer: number;
}

export function generateQuestions(customConfig?: any): Question[] {
  const questions: Question[] = [];

  for (let i = 0; i < 10; i++) {
    let num1 = Math.floor(Math.random() * 50) + 1;
    let num2 = Math.floor(Math.random() * 30) + 1;
    const operation = Math.random() > 0.5 ? '+' : '-';

    // For subtraction, ensure first number is bigger than second
    if (operation === '-' && num1 < num2) {
      [num1, num2] = [num2, num1]; // Swap the numbers
    }

    const question = `${num1} ${operation} ${num2}`;
    const answer = operation === '+' ? num1 + num2 : num1 - num2;

    questions.push({
      id: i + 1,
      question,
      answer
    });
  }

  return questions;
}