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

import { NotificationsModel } from "../../models/notifications.model";


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

    console.log(
        "Publishing completion event"
    );

    if (!result.success) {

        await AssignmentInputModel.findByIdAndUpdate(
            job.data._id,
            {
                status: "failed"
            }
        );

        await NotificationsModel.create({
            title: "Assignment Creation Failed",
            message: result.message || "Failed to create assignment",
            assignmentName: job.data.assignmentName,
            assignmentId: job.data._id
        })


        





        await publisher.publish(

            "assignment-events",

            JSON.stringify({

                type: "assignment-failed",

                roomId: "teacher_room",

                payload: {

                    assignmentId:
                        job.data._id,

                    assignmentName:
                        job.data.assignmentName,

                    status: "failed"
                }
            })
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

    await NotificationsModel.create({
            title: "Assignment Creation Successful",
            message: result.message || "Successfully created assignment",
            assignmentName: job.data.assignmentName,
            assignmentId: job.data._id
        })
        

    // store generated response:
    await AgentResponseModel.create({
        success: result.success,
        message: result.message,
        assignmentInputId: result.assignmentInputId,
        assignment: result.assignment
    })

    // send notification to socket server:
    await publisher.publish(

        "assignment-events",

        JSON.stringify({

            type: "assignment-completed",

            roomId: "teacher_room",

            payload: {

                assignmentId:
                    job.data._id,

                assignmentName:
                    job.data.assignmentName,

                status: "completed"
            }
        })
    );

    console.log(
        "Publishing completion event"
    );

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