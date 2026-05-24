import { Agent, run } from '@openai/agents';
import { systemPromptMainAgent } from "./utils/constants";
import { AgentResponseSchema } from "../schemas/assignment.zod-schema"
import dotenv from "dotenv";
import type { AssignmentInputStorage } from "../types/assignment.types"
import type { AgentResponse } from "../schemas/assignment.zod-schema"
import getFileContent from "@/../utils/getFileContent"

dotenv.config({
    path: "./.env"
});


const baseurl = "/"



const agent = new Agent({
    name: 'Assignment Creator Agent',
    instructions: `${systemPromptMainAgent}`,
    model: 'gpt-4.1',
    outputType: AgentResponseSchema,
    modelSettings: {
        temperature: 0
    }
});


async function createAssignment(assignmentInput: AssignmentInputStorage): Promise<AgentResponse> {
    try {

        let fileType: "txt" | "pdf" | null = null;
        let fileContent: string | null = null;

        if (assignmentInput.fileUrl) {
            assignmentInput.fileUrl = `${assignmentInput.fileUrl}`;
            fileType = assignmentInput.fileUrl.split('.').pop() as "txt" | "pdf";
            fileContent = await getFileContent(assignmentInput.fileUrl, fileType);

            // console.log(`File content retrieved successfully from ${assignmentInput.fileUrl}`);
            // console.log(`📁📁`)
            // console.log(fileContent);
        }



        const result = await run(
            agent,
            `
            Create an assignment using the following data:

            ${JSON.stringify({
                ...assignmentInput,
                extraInfo: fileContent
                    ? `Attached content:\n${fileContent}`
                    : "No file attached"
            })}

            Return ONLY valid structured JSON matching the required schema.
            `
        );

        // console.log("Raw Agent Output:", result.finalOutput);
        console.log("Generating output for assignment creation...");

        console.log("Raw Agent Output: 🤖");
        console.log(JSON.stringify(result.finalOutput));

        const parsed =
            AgentResponseSchema.safeParse(result.finalOutput);

        if (!parsed.success) {
            return {
                success: false,
                message: "Invalid AI response format",
                assignmentInputId: assignmentInput._id
            }
        }

        console.log("Parsed Agent Response:", parsed.data);

        return parsed.data;
    }
    catch (error: any) {
        console.error("Error creating assignment:", error);
        return {
            success: false,
            message: "An error occurred while creating the assignment.",
            assignmentInputId: assignmentInput._id
        }
    }
}


// await createAssignment({
//     assignmentName: "Algebra Basics",
//     dueDate: new Date("2024-12-01"),
//     questionTypes: [{
//         type: "multiple-choice",
//         numberOfQuestions: 5,
//         marks: 50
//     }, {
//         type: "short-answer",
//         numberOfQuestions: 5,
//         marks: 50
//     }],
//     fileUrl: "instructions.txt",
//     totalQuestions: 10,
//     totalMarks: 100,
//     additionalNotes: "Focus on linear equations and inequalities."
// })


export default createAssignment;