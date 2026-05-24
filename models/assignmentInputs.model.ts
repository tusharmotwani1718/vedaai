import mongoose, { Schema, model } from "mongoose";
import type { Question, QuestionType, AssignmentInputStorage } from "../types/assignment.types.ts";



const QuestionSchema = new Schema<Question>(
  {
    type: {
      type: String,
      enum: [
        "Multiple Choice Questions",
        "Short Questions",
        "Diagram/Graph-Based Questions",
        "Numerical Problems"
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

const AssignmentInputSchema = new Schema<AssignmentInputStorage>(
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

    status: {
      type: String,
      default: "pending",
      enum: ["pending", "completed", "failed"]
    },

    fileUrl: String,
    additionalNotes: String
  },
  {
    timestamps: true
  }
);

export const AssignmentInputModel =
  mongoose.models.AssignmentInput ||
  model<AssignmentInputStorage>(
    "AssignmentInput",
    AssignmentInputSchema
  );