export type QuestionType =
  | "multiple-choice"
  | "short-answer"
  | "Diagram/Graph based"
  | "numerical";

export interface Question {
  type: QuestionType;
  numberOfQuestions: number;
  marks: number;
}

export interface AssignmentInput {
  assignmentName: string;
  dueDate: Date;
  questionTypes: Question[];
  totalQuestions?: number;
  totalMarks?: number;
  fileUrl?: string;
  fileName?: string;
  additionalNotes?: string;
}