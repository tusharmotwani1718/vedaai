import mongoose, { Schema, model, models } from "mongoose";
import type {Question, QuestionType, AssignmentInput} from "../types/assignment.types.ts";



const QuestionSchema = new Schema<Question>(
  {
    type: {
      type: String,
      enum: [
        "multiple-choice",
        "short-answer",
        "Diagram/Graph based",
        "numerical"
      ],
      required: true
    },
    numberOfQuestions: {
      type: Number,
      required: true
    },
    marks: {
      type: Number,
      required: true
    }
  },
  { _id: false }
);

const AssignmentInputSchema = new Schema<AssignmentInput>(
  {
    assignmentName: {
      type: String,
      required: true
    },

    dueDate: {
      type: Date,
      required: true
    },

    questionTypes: {
      type: [QuestionSchema],
      required: true
    },

    totalQuestions: {
      type: Number,
      required: true
    },

    totalMarks: {
      type: Number,
      required: true
    },

    fileUrl: String,
    fileName: String,
    additionalNotes: String
  },
  {
    timestamps: true
  }
);

export const AssignmentInputModel =
  models.AssignmentInput ||
  model<AssignmentInput>(
    "AssignmentInput",
    AssignmentInputSchema
  );