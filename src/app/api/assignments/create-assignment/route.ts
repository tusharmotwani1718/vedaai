import { asyncHandler } from "../../../../../lib/db/api-utils/asyncHandler"
import { ApiError } from "../../../../../lib/db/api-utils/ApiError"
import { ApiResponse } from "../../../../../lib/db/api-utils/ApiResponse"
import { NextResponse } from "next/server"
import type { AssignmentInput } from "../../../../../types/assignment.types"
import { AssignmentInputModel } from "../../../../../models/assignmentInputs.model"
import dbConnect from "../../../../../lib/db/dbConnect.js"


export const POST = asyncHandler(async function (req: Request): Promise<NextResponse> {

    const body = await req.json()
    const {
        assignmentName,
        dueDate,
        questionTypes,
        fileName,
        fileUrl
    } : AssignmentInput = body;


    if(!assignmentName || !dueDate || !questionTypes ) {
        throw new ApiError(400, "Missing required fields: assignmentName, dueDate, questionTypes")
    }




    let totalMarks = 0;
    let totalQuestions = 0;

    questionTypes.map((questionType) => {
        totalMarks += questionType.marks * questionType.numberOfQuestions;
        totalQuestions += questionType.numberOfQuestions;
    })


    await dbConnect();


    const newAssignment: AssignmentInput = await AssignmentInputModel.create({
        assignmentName,
        dueDate,
        questionTypes,
        totalQuestions,
        totalMarks,
        fileName,
        fileUrl
    })

    if(!newAssignment) {
        throw new ApiError(500, "Failed to create assignment")
    }

    return new ApiResponse(200, "Assignment created successfully", newAssignment).send()
})
