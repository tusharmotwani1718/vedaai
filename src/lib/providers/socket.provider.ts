"use client";

import { useEffect } from "react";

import socket from "../../../lib/socket/socket";

import { toast } from "sonner";

import { useAssignmentStore } from "../../../store/assignments.store";


export default function SocketProvider() {

    const {updateStatus} = useAssignmentStore();

    useEffect(() => {

        console.log(
            "SocketProvider mounted"
        );


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
            "connect_error",

            (err) => {

                console.log(
                    "SOCKET ERROR:",
                    err
                );
            }
        );


        socket.onAny((event, ...args) => {

            console.log(
                "SOCKET EVENT RECEIVED:",
                event,
                args
            );
        });


        socket.on(
            "assignment-completed",

            (data) => {

                console.log(
                    "REALTIME EVENT:",
                    data
                );

                toast.success(
                    `${data.assignmentName} generated successfully`
                );

                updateStatus(data.assignmentId, "completed");
            }

            
            
        );

        socket.on(
            "assignment-failed",

            (data) => {

                console.log(
                    "REALTIME EVENT:",
                    data
                );

                toast.error(
                    `${data.assignmentName} generation failed`
                );

                updateStatus(data.assignmentId, "failed");

            }
        );


        return () => {

            socket.off();
        };

    }, []);


    return null;
}