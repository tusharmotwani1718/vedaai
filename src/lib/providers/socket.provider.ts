"use client";

import { useEffect } from "react";

import socket from "../../../lib/socket/socket";

import { toast } from "sonner";


export default function SocketProvider() {

    useEffect(() => {

        socket.on("connect", () => {

            console.log(
                "Connected:",
                socket.id
            );

            socket.emit(
                "join",
                "teacher_room"
            );
        });


        socket.on(
            "assignment-completed",

            (data) => {

                console.log(
                    "REALTIME EVENT:",
                    data
                );

                toast.success(`${data.assignmentName} generated successfully`);
            }
        );

        socket.on(
            "assignment-failed",

            (data) => {

                console.log(
                    "Failed:",
                    data
                );

                toast.error(`${data.assignmentName} generation failed`);
            }
        );


        return () => {

            socket.off("connect");

            socket.off(
                "assignment-completed"
            );
        };

    }, []);


    return null;
}