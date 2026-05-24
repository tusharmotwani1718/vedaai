import { io } from "socket.io-client";

console.log(
    "Creating socket instance"
);

const socket = io(
    "http://localhost:3000",
    {
        transports: ["websocket"]
    }
);

socket.on("connect", () => {

    console.log(
        "GLOBAL CONNECT:",
        socket.id
    );
});


export default socket;