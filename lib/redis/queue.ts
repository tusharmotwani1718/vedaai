import {Queue} from 'bullmq';


const connection = {
  host: 'localhost',
  port: 6379,
};

// this is the queue that will be used to store the assignment jobs
const assignmentQueue = new Queue('assignment', {connection});

export {
    assignmentQueue,
    connection
}