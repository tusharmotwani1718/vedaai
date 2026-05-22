import { NextResponse } from "next/server";

export class ApiResponse {


    statusCode: number;
    message: string;
    data: any;
    success: boolean;

    constructor(statusCode: number = 200, message: string = "Success", data: any = null) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.success = statusCode < 400;
    }

    send() {
        return NextResponse.json(
            {
                success: this.success,
                message: this.message,
                data: this.data,
            },
            {
                status: this.statusCode,
            }
        );
    }
}