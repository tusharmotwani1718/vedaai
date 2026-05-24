import { createClient } from "redis";

// publisher client
const publisher = createClient({
    url: "redis://localhost:6379"
});


// subscriber client
const subscriber = publisher.duplicate();

// connect both clients
async function connectPubSub() {

    await publisher.connect();

    await subscriber.connect();

    console.log("Redis Pub/Sub connected");
}



export {
    publisher,
    subscriber,
    connectPubSub
};