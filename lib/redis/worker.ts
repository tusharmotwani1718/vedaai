import { Worker, Job } from "bullmq";

import { connection } from "./queue";

import createAssignment from "../../openai/agent";

import type {
    AssignmentInputStorage
} from "../../types/assignment.types";

import type {
    AgentResponse
} from "../../schemas/assignment.zod-schema";


// Worker processor
const assignmentWorkerConsumer = async (
    job: Job<AssignmentInputStorage>
): Promise<AgentResponse> => {

    console.log(
        "Processing assignment job:",
        job.data.assignmentName
    );

    try {

        const result = await createAssignment(
            job.data
        );

        console.log(
            "Assignment created successfully:",
            result
        );

        return result;

    } catch (error) {

        console.error(
            "Error processing assignment job:",
            error
        );

        return {
            success: false,
            message: "Failed to create assignment"
        };
    }
};

const assignmentWorker = new Worker<
    AssignmentInputStorage,
    AgentResponse
>(
    "create-assignment-worker",

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