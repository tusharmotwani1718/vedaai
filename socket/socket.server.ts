import { Server } from "socket.io";

let io: Server;


function initSocket(server: any) {

    io = new Server(server, {

        cors: {
            origin: "*"
        }
    });

    io.on("connection", (socket) => {

        console.log(
            "Client connected:",
            socket.id
        );


        // user joins their own room
        socket.on(
            "join",

            (userId: string = "teacher_room") => {

                socket.join(userId);

                console.log(
                    `User ${userId} joined room`
                );
            }
        );


        socket.on("disconnect", () => {

            console.log(
                "Client disconnected:",
                socket.id
            );
        });
    });

    return io;
}


function getIO() {

    if (!io) {
        throw new Error(
            "Socket.io not initialized"
        );
    }

    return io;
}


export {
    initSocket,
    getIO
};