/**
 * Error type that carries an HTTP status and a stable, machine-readable code.
 *
 * Anything thrown from a route handler that is *not* an `HttpError` is treated
 * as an unexpected failure and reported as a 500 with a generic message, so
 * internal details never leak to the client.
 */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }

  static badRequest(message: string, code = 'BAD_REQUEST'): HttpError {
    return new HttpError(400, code, message);
  }

  static notFound(message = 'Resource not found', code = 'NOT_FOUND'): HttpError {
    return new HttpError(404, code, message);
  }
}
