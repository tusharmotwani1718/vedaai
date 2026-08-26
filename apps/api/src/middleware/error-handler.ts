import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { ApiFailure } from '@vedaai/shared';

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

  // Unexpected failure: log the detail server-side, return a generic message.
  console.error('[api] unhandled error:', err);
  const body: ApiFailure = {
    ok: false,
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' },
  };
  res.status(500).json(body);
};
