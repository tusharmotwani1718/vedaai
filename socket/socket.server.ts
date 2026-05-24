import { Server } from "socket.io";


declare global {

    var ioGlobal: Server | undefined;
}


function initSocket(server: any) {

    if (!global.ioGlobal) {

        global.ioGlobal = new Server(server, {

            cors: {
                origin: "*"
            }
        });


        global.ioGlobal.on(

            "connection",

            (socket) => {

                console.log(
                    "Client connected:",
                    socket.id
                );


                socket.on(

                    "join",

                    async (roomId: string) => {

                        console.log(
                            "JOIN EVENT RECEIVED:",
                            roomId
                        );

                        await socket.join(roomId);

                        console.log(
                            "SOCKET ROOMS:",
                            [...socket.rooms]
                        );
                    }
                );


                socket.on(

                    "disconnect",

                    () => {

                        console.log(
                            "Client disconnected:",
                            socket.id
                        );
                    }
                );
            }
        );
    }

    return global.ioGlobal;
}


function getIO() {

    if (!global.ioGlobal) {

        throw new Error(
            "Socket.io not initialized"
        );
    }

    return global.ioGlobal;
}


export {
    initSocket,
    getIO
};