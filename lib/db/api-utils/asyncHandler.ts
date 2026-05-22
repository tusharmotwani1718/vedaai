import { NextResponse } from "next/server";
import { ApiError } from "./ApiError";




type HandlerFunction = (req: Request, context: any) => Promise<NextResponse>;



export const asyncHandler = (handler: HandlerFunction) => async (req: Request, context: any) => {
  try {
    return await handler(req, context);
  } catch (error) {
    console.error(error);
    console.error(JSON.stringify(error));
    if (error instanceof ApiError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
          errors: error.errors,
        },
        { status: error.statusCode }
      );
    }


    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
};