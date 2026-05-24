import { createClient } from "redis";

const publisher = createClient({
    url: "redis://localhost:6379"
});

const socketSubscriber =
    publisher.duplicate();


async function connectPubSub() {

    await publisher.connect();

    await socketSubscriber.connect();

    console.log(
        "Redis Pub/Sub connected"
    );
}

export {
    publisher,
    socketSubscriber,
    connectPubSub
};