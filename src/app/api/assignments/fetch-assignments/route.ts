import { asyncHandler } from "../../../../../lib/db/api-utils/asyncHandler"
import { ApiError } from "../../../../../lib/db/api-utils/ApiError"
import { ApiResponse } from "../../../../../lib/db/api-utils/ApiResponse"
import { NextResponse } from "next/server"
import { AssignmentInputModel } from "../../../../../models/assignmentInputs.model"
import dbConnect from "../../../../../lib/db/dbConnect.js"

export const GET = asyncHandler(async function (req: Request): Promise<NextResponse> {

    await dbConnect();

    const assignments = await AssignmentInputModel.find().sort({ createdAt: -1 });

    if(!assignments) {
        throw new ApiError(404, "Assignments not found");
    }

    return new ApiResponse(
        200,
        "Assignments fetched successfully",
        {
            assignments
        }
    ).send();
})