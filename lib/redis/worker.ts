import { Worker, Job } from "bullmq";

import { connection } from "./queue";

import createAssignment from "../../openai/agent";

import { AssignmentInputModel } from "../../models/assignmentInputs.model";
import { AgentResponseModel } from "../../models/assignmentGenerations.model";

import dbConnect from "../../lib/db/dbConnect";

import type {
    AssignmentInputStorage
} from "../../types/assignment.types";

import type {
    AgentResponse
} from "../../schemas/assignment.zod-schema";

import { connectPubSub, publisher } from "./pubsub";


await connectPubSub();


// Worker processor
const assignmentWorkerConsumer = async (
    job: Job<AssignmentInputStorage>
): Promise<AgentResponse> => {

    console.log("Processing:", job.data.assignmentName);

    const result = await createAssignment(job.data);

    console.log("result");
    console.log(result);

    await dbConnect();

    if (!result.success) {

        await AssignmentInputModel.findByIdAndUpdate(
            job.data._id,
            {
                status: "failed"
            }
        );

        throw new Error(result.message);
    }

    await AssignmentInputModel.findByIdAndUpdate(
        job.data._id,
        {
            status: "completed",
            generatedAssignment: result
        }
    );

    // store generated response:
    await AgentResponseModel.create({
        success: result.success,
        message: result.message,
        assignmentInputId: result.assignmentInputId,
        assignment: result.assignment
    })

    // send notification to socket server:
    await publisher.publish("assignment-events", JSON.stringify({
        event: "assignment-generated",
        assignmentId: job.data._id,
        assignmentName: job.data.assignmentName,
        status: result.success ? "completed" : "failed"
    }));

    return result;
};

const assignmentWorker = new Worker<
    AssignmentInputStorage,
    AgentResponse
>(
    "assignment",

    assignmentWorkerConsumer,

    { connection }
);

assignmentWorker.on(
    "completed",
    (job) => {

        console.log(
            `Job ${job.id} has been completed.`
        );
    });

assignmentWorker.on(
    "failed",
    (job, err) => {

        console.error(
            `Job has failed with error:`,
            err
        );
    });