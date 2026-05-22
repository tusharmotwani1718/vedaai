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


// Generated Assignment:
// export interface GeneratedAssignment {
//   schoolName?: string;
//   subject: string;
//   className: string;
//   duration: string;
//   maximumMarks: number;

//   sections: AssignmentSection[];

//   answerKey?: AnswerSection[];
// }

// export interface AssignmentSection {
//   title: string;
//   instructions?: string;
//   questions: GeneratedQuestion[];
// }

// export interface GeneratedQuestion {
//   id: number;
//   type: QuestionType;

//   question: string;

//   options?: string[]; // for MCQs

//   marks: number;

//   difficulty?: "easy" | "moderate" | "challenging";

//   answer?: string;
// }

// export interface AnswerSection {
//   questionId: number;
//   answer: string;
// }


// export interface AgentResponse {
//   success: boolean;
//   message: string;
//   assignment?: GeneratedAssignment;
// }