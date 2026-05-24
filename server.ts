import next from "next";

import http from "http";

import { parse } from "url";

import { initSocket } from "./socket/socket.server";

import startSocketSubscriber
from "./socket/socket.subscriber";

import {
    connectPubSub
} from "./lib/redis/pubsub";


const dev =
    process.env.NODE_ENV !== "production";

const hostname = "localhost";

const port = 3000;


const app = next({
    dev,
    hostname,
    port
});

const handler =
    app.getRequestHandler();


app.prepare().then(async () => {

    const httpServer =
        http.createServer(

            async (req, res) => {

                try {

                    const parsedUrl =
                        parse(req.url!, true);

                    await handler(
                        req,
                        res,
                        parsedUrl
                    );

                } catch (err) {

                    console.error(err);

                    res.statusCode = 500;

                    res.end("internal server error");
                }
            }
        );


    initSocket(httpServer);

    await connectPubSub();

    await startSocketSubscriber();


    httpServer.listen(port, () => {

        console.log(
            `> Ready on http://${hostname}:${port}`
        );
    });
});