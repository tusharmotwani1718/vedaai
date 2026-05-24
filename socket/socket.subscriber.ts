import {
    socketSubscriber
} from "../lib/redis/pubsub";

import { getIO } from "./socket.server";


async function startSocketSubscriber() {

    console.log(
        "Starting socket subscriber..."
    );

    const io = getIO();


    await socketSubscriber.subscribe(

        "assignment-events",

        async (message) => {

            console.log(
                "RAW MESSAGE:",
                message
            );

            const data =
                JSON.parse(message);

            console.log(
                "Received Redis Event:",
                data
            );


            console.log(
                "EMITTING GLOBALLY"
            );

            io.emit(
                data.type,
                data.payload
            );

            console.log(
                "Socket event emitted"
            );
        }
    );

    console.log(
        "Socket subscriber connected"
    );
}


export default startSocketSubscriber;