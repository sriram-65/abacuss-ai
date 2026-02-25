export interface User {
  id: string;
  username: string;
  role: 'admin' | 'student';
}

export interface Question {
  id: string;
  title: string;
  digits: number;
  columns: number;
  allow_negative: boolean;
  problems: {
    numbers: number[];
    answer: number;
  }[];
}

export interface QuestionResult {
  questionId: string;
  timeTaken: number;
  isCorrect: boolean;
  userAnswer: number;
  correctAnswer: number;
}

export interface QuizResult {
  id: string;
  total_questions: number;
  correct_answers: number;
  accuracy: number;
  total_time: number;
  details: QuestionResult[];
  created_at: string;
}
