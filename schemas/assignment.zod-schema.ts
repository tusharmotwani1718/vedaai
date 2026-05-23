import { z } from "zod";
import mongoose from "mongoose";

const GeneratedQuestionSchema = z.object({
  id: z.number(),

  type: z.enum([
    "multiple-choice",
    "short-answer",
    "Diagram/Graph based",
    "numerical"
  ]),

  question: z.string(),

  options: z.array(z.string()).optional(),

  marks: z.number(),

  difficulty: z
    .enum(["easy", "moderate", "challenging"])
    .optional(),

  answer: z.string().optional()
});

const AssignmentSectionSchema = z.object({
  title: z.string(),

  instructions: z.string().optional(),

  questions: z.array(GeneratedQuestionSchema)
});

const AnswerSectionSchema = z.object({
  questionId: z.number(),
  answer: z.string()
});

const GeneratedAssignmentSchema = z.object({
  schoolName: z.string().default("Unknown"),

  subject: z.string().default("General"),

  className: z.string().default("Unknown"),

  duration: z.string().default("Unknown"),

  maximumMarks: z.number(),

  sections: z.array(AssignmentSectionSchema),

  answerKey: z.array(AnswerSectionSchema).optional()
});



export const AgentResponseSchema = z.object({
  success: z.boolean(),

  message: z.string(),

  assignmentInputId: z.string(),

  assignment: GeneratedAssignmentSchema.optional()
});

// Infer TypeScript types from Zod schemas
export type AgentResponse = z.infer<typeof AgentResponseSchema>;
export type GeneratedAssignment = z.infer<typeof GeneratedAssignmentSchema>;
export type AssignmentSection = z.infer<typeof AssignmentSectionSchema>;
export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;
export type AnswerSection = z.infer<typeof AnswerSectionSchema>;