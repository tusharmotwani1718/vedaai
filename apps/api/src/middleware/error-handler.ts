import type { ErrorRequestHandler, RequestHandler } from 'express';
import { MulterError } from 'multer';
import { MAX_UPLOAD_MB, type ApiFailure } from '@vedaai/shared';

import { HttpError } from '../http-error';

/** Terminal 404 handler — mounted after every route. */
export const notFoundHandler: RequestHandler = (req, res) => {
  const body: ApiFailure = {
    ok: false,
    error: { code: 'NOT_FOUND', message: `No route matches ${req.method} ${req.path}` },
  };
  res.status(404).json(body);
};

/**
 * Central error handler. Express 5 forwards rejected promises from async
 * handlers here automatically, so route code never needs its own try/catch.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    const body: ApiFailure = {
      ok: false,
      error: { code: err.code, message: err.message },
    };
    res.status(err.status).json(body);
    return;
  }

  // Multer rejects an upload before any route sees it, so its errors arrive
  // here rather than as HttpErrors. Without this they render as a bare 500 and
  // the client can only say "something went wrong" for an oversized file.
  if (err instanceof MulterError) {
    const body: ApiFailure = {
      ok: false,
      error: {
        code: err.code,
        message:
          err.code === 'LIMIT_FILE_SIZE'
            ? `"${err.field}" is larger than the ${MAX_UPLOAD_MB}MB limit`
            : err.message,
      },
    };
    res.status(413).json(body);
    return;
  }

  // Unexpected failure: log the detail server-side, return a generic message.
  console.error('[api] unhandled error:', err);
  const body: ApiFailure = {
    ok: false,
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' },
  };
  res.status(500).json(body);
};
