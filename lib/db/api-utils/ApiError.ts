export class ApiError extends Error {
  statusCode: number;
  message: string;
  errors: any[];
  success: boolean;

  constructor(statusCode: number = 500, message: string = "Something went wrong", errors: any[] = []) {
    super(message);

    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors;
    this.success = false;

  }
}