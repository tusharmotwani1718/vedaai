export interface Response {
    success: true;
    message: string;
    data?: any;
}


export interface ErrorResponse {
    success: false;
    message: string;
    data?: any;
    error: any;
}