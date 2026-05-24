export interface QuestionType {
  id: string;
  type: string;
  numberOfQuestions: number;
  marks: number;
}

export interface UploadedFileType {
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
  actualFile?: File;
}

export interface AssignmentFormValues {
  assignmentName: string;
  uploadedFile: UploadedFileType | null;
  dueDate: string;

  questionTypes: QuestionType[];

  additionalNotes: string;
}

export const QUESTION_TYPES = [
  "Multiple Choice Questions",
  "Short Questions",
  "Diagram/Graph-Based Questions",
  "Numerical Problems",
];
