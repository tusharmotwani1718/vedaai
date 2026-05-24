import { subscriber, connectPubSub } from "./pubsub";

async function startSubscriber() {

    await connectPubSub();

    await subscriber.subscribe(

        "assignment-events",

        (message) => {

            const data = JSON.parse(message);

            console.log(
                "Received Event:",
                data
            );
        }
    );
}

startSubscriber();