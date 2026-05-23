import { asyncHandler } from "../../../../../lib/db/api-utils/asyncHandler"
import { ApiError } from "../../../../../lib/db/api-utils/ApiError"
import { ApiResponse } from "../../../../../lib/db/api-utils/ApiResponse"
import { NextResponse } from "next/server"
import type { Question, AssignmentInputStorage } from "../../../../../types/assignment.types"
import { AssignmentInputModel } from "../../../../../models/assignmentInputs.model"
import dbConnect from "../../../../../lib/db/dbConnect.js"
import uploadFile from "@/../utils/uploadFile";
import {assignmentQueue} from "@/../lib/redis/queue"

export const POST = asyncHandler(async function (req: Request): Promise<NextResponse> {

    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const assignmentName = formData.get("assignmentName") as string;
    const dueDate = formData.get("dueDate") as string;
    const questionTypes = JSON.parse(formData.get("questionTypes") as string) as Question[];
    const additionalNotes = formData.get("additionalNotes") as string | null;

    let fileUrl: string | undefined = undefined;



    if (!assignmentName || !dueDate || !questionTypes) {
        throw new ApiError(400, "Missing required fields: assignmentName, dueDate, questionTypes")
    }




    let totalMarks = 0;
    let totalQuestions = 0;

    questionTypes.map((questionType: Question) => {
        totalMarks += questionType.marks * questionType.numberOfQuestions;
        totalQuestions += questionType.numberOfQuestions;
    })


    // handle file upload if file is present
    if (file) {
        fileUrl = await uploadFile(file);
        fileUrl = fileUrl.replace(/\\/g, "/").replace(" ", "_").trim().toLowerCase();
        console.log("File uploaded successfully. URL:", fileUrl);
    }


    await dbConnect();


    const newAssignment: AssignmentInputStorage = await AssignmentInputModel.create({
        assignmentName,
        dueDate,
        questionTypes,
        totalQuestions,
        totalMarks,
        fileUrl,
        additionalNotes: additionalNotes || undefined,
    })

    if (!newAssignment) {
        throw new ApiError(500, "Failed to create assignment")
    }


    // add to redis queue for processing:
    await assignmentQueue.add("create-assignment-job", newAssignment, 
        {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 1000
            }
        }
    );

    return new ApiResponse(200, "Assignment created successfully", {
        assignment: newAssignment
    }).send()
})
