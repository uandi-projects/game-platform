// Custom Math Race game question generation

export interface Question {
  id: number;
  question: string;
  answer: number;
}

export function generateQuestions(customConfig?: any): Question[] {
  // For custom games, use the config provided by the user
  if (customConfig?.questions && Array.isArray(customConfig.questions)) {
    return customConfig.questions.map((q: any, index: number) => ({
      id: index + 1,
      question: q.question,
      answer: q.answer,
      // Include any additional properties from the custom config
      ...q
    }));
  }

  // If no custom questions provided, fall back to default generation
  const questions: Question[] = [];
  const questionCount = customConfig?.questionCount || 10;

  for (let i = 0; i < questionCount; i++) {
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