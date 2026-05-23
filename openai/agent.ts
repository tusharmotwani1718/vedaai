import { Agent, run } from '@openai/agents';
import { systemPromptMainAgent } from "./utils/constants";
import { AgentResponseSchema } from "../schemas/assignment.zod-schema"
import dotenv from "dotenv";
import type { AssignmentInput } from "../types/assignment.types"
import type { AgentResponse } from "../schemas/assignment.zod-schema"

dotenv.config({
    path: "./.env"
});






const agent = new Agent({
    name: 'Assignment Creator Agent',
    instructions: `${systemPromptMainAgent}`,
    model: 'gpt-4.1-mini',
    outputType: AgentResponseSchema,
});


async function createAssignment(assignmentInput: AssignmentInput): Promise<AgentResponse> {
    try {
        const result = await run(agent, JSON.stringify(assignmentInput));

        // console.log("Raw Agent Output:", result.finalOutput);
        console.log("Generating output for assignment creation...");

        console.log("Raw Agent Output: 🤖");
        console.log(JSON.stringify(result.finalOutput));

        const parsed =
            AgentResponseSchema.safeParse(result.finalOutput);

        if (!parsed.success) {
            return {
                success: false,
                message: "Invalid AI response format"
            }
        }

        console.log("Parsed Agent Response:", parsed.data);

        return parsed.data;
    }
    catch (error: any) {
        console.error("Error creating assignment:", error);
        return {
            success: false,
            message: "An error occurred while creating the assignment."
        }
    }
}


await createAssignment({
    assignmentName: "Algebra Basics",
    dueDate: new Date("2024-12-01"),
    questionTypes: [{
        type: "multiple-choice",
        numberOfQuestions: 5,
        marks: 50
    }, {
        type: "short-answer",
        numberOfQuestions: 5,
        marks: 50
    }],
    totalQuestions: 10,
    totalMarks: 100,
    additionalNotes: "Focus on linear equations and inequalities. The School name is ABC High School, the subject is Mathematics, and the class is 9th grade."
})