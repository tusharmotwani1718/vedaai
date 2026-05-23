import { asyncHandler } from "../../../../../../lib/db/api-utils/asyncHandler"
import { ApiError } from "../../../../../../lib/db/api-utils/ApiError"
import { ApiResponse } from "../../../../../../lib/db/api-utils/ApiResponse"
import { NextResponse } from "next/server"
import { AgentResponseModel } from "../../../../../../models/assignmentGenerations.model";
import dbConnect from "../../../../../../lib/db/dbConnect.js"

export const GET = asyncHandler(async function (req: Request, { params }: { params: { assignment_id: string }}): Promise<NextResponse> {
    const { assignment_id } = await params;

    console.log("Assignment ID:", assignment_id);

    await dbConnect();

    const assignment = await AgentResponseModel.find({
        assignmentInputId: assignment_id
    }).sort({ createdAt: -1 }).limit(1);

    if (!assignment) {
        throw new ApiError(404, "Generated Assignment not found");
    }


    return new ApiResponse(
        200,
        "Generated Assignment found successfully",
        {
            assignment
        }
    ).send();
})