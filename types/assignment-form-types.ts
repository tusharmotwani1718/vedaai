export interface QuestionRow {
  id: string;
  type: string;
  count: number;
  marks: number;
}

export interface AssignmentFormValues {
  uploadedFile: {
    name: string;
    size: number;
    type: string;
    previewUrl?: string;
  } | null;
  dueDate: string;
  questions: QuestionRow[];
  additionalInfo: string;
}

export const QUESTION_TYPES = [
  "Multiple Choice Questions",
  "Short Questions",
  "Diagram/Graph-Based Questions",
  "Numerical Problems",
  "Long Answer Questions",
  "True or False",
  "Fill in the Blanks"
];
