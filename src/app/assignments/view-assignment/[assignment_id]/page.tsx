import { Suspense } from 'react';
import { Loader } from '../../../../_components/utils/loader';
import AssignmentDisplay from '../../../../_components/assignments/AssignmentDisplay';
import { AgentResponseModel } from '../../../../../models/assignmentGenerations.model';
import dbConnect from '../../../../../lib/db/dbConnect';
import type { GeneratedAssignment } from '../../../../../schemas/assignment.zod-schema';

async function AssignmentData({ assignment_id }: { assignment_id: string }) {
    await dbConnect();

    const doc = await AgentResponseModel.findOne({
        assignmentInputId: assignment_id
    }).lean();

    if (!doc || !doc.assignment) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-gray-500 font-medium">Assignment not found.</p>
            </div>
        );
    }

    const assignment = JSON.parse(JSON.stringify(doc.assignment)) as GeneratedAssignment;

    return <AssignmentDisplay assignment={assignment} />;
}

export default async function Page({ params }: { params: Promise<{ assignment_id: string }> }) {
    const { assignment_id } = await params;

    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader />
                </div>
            }
        >
            <AssignmentData assignment_id={assignment_id} />
        </Suspense>
    );
}
