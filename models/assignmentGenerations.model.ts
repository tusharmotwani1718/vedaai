import mongoose, { Schema, model, models } from "mongoose";
import type { AgentResponse, GeneratedAssignment, AssignmentSection, GeneratedQuestion, AnswerSection } from "../schemas/assignment.zod-schema.ts";


const GeneratedQuestionSchema = new Schema<GeneratedQuestion>({
    id: {
        type: Number,
        required: true
    },
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
    question: {
        type: String,
        required: true
    },
    options: {
        type: [String],
        required: false
    },
    marks: {
        type: Number,
        required: true
    },
    difficulty: {
        type: String,
        enum: ["easy", "moderate", "challenging"],
        required: false
    },
    answer: {
        type: String,
        required: false
    }
})

const AssignmentSectionSchema = new Schema<AssignmentSection>({
    title: {
        type: String,
        required: true
    },
    instructions: {
        type: String,
        required: false
    },
    questions: {
        type: [GeneratedQuestionSchema],
        required: true
    }
})

const AnswerSectionSchema = new Schema<AnswerSection>({
    questionId: {
        type: Number,
        required: true
    },
    answer: {
        type: String,
        required: true
    }
})

const GeneratedAssignmentSchema = new Schema<GeneratedAssignment>({
    schoolName: {
        type: String,
        default: "Unknown"
    },
    subject: {
        type: String,
        default: "General"
    },
    className: {
        type: String,
        default: "Unknown"
    },
    duration: {
        type: String,
        default: "Unknown"
    },
    maximumMarks: {
        type: Number,
        required: true
    },
    sections: {
        type: [AssignmentSectionSchema],
        required: true
    },
    answerKey: {
        type: [AnswerSectionSchema],
        required: false
    }
})



const AgentResponseSchema = new Schema<AgentResponse>({
    success: {
        type: Boolean,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    assignment: {
        type: GeneratedAssignmentSchema,
        required: false
    }
})



export const AgentResponseModel = models.AgentResponse || model<AgentResponse>("AgentResponse", AgentResponseSchema);

export const GeneratedAssignmentModel = models.GeneratedAssignment || model<GeneratedAssignment>("GeneratedAssignment", GeneratedAssignmentSchema);
