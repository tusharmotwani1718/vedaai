import AssignmentDisplay from "@/_components/assignments/AssignmentDisplay";
import { AgentResponseModel } from "../../../../../../models/assignmentGenerations.model";
import dbConnect from '../../../../../../lib/db/dbConnect';
import { notFound } from "next/navigation";
import type { GeneratedAssignment } from '../../../../../../schemas/assignment.zod-schema';


async function getAssignment(id: string): Promise<any> {
    await dbConnect();

    const doc = await AgentResponseModel.findOne({
        assignmentInputId: id
    }).lean();

    if (!doc || !doc.assignment) {
        notFound();
    }

    const assignment = JSON.parse(JSON.stringify(doc.assignment)) as GeneratedAssignment;

    return assignment;
}

export default async function PrintAssignmentPage({
    params
}: {
    params: { id: string }
}) {

    const { id } = await params;


    const assignment = await getAssignment(id);

    return (
        <AssignmentDisplay assignment={assignment} _id={id} showDownloadButton={false} />
    );
}