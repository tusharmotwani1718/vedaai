import next from "next";

import http from "http";

import { initSocket } from "./socket/socket.server";

import startSocketSubscriber
from "./socket/socket.subscriber";

import { connectPubSub } from "./lib/redis/pubsub";


const dev =
    process.env.NODE_ENV !== "production";

const hostname = "localhost";

const port = 3000;


const app = next({
    dev,
    hostname,
    port
});

const handler = app.getRequestHandler();


app.prepare().then(() => {

    const httpServer =
        http.createServer(handler);


    initSocket(httpServer);

    connectPubSub();

    startSocketSubscriber();


    httpServer.listen(port, () => {

        console.log(
            `Server ready on http://${hostname}:${port}`
        );
    });
});