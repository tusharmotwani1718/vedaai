import cors from 'cors';
import express, { type Express } from 'express';

import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { apiRouter } from './routes';

/**
 * Builds the Express application.
 *
 * Kept separate from `index.ts` so tests can exercise the app without binding
 * to a port.
 */
export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());

  app.use('/api', apiRouter);

  // Order matters: 404 first, then the error handler (Express identifies the
  // latter by its four-argument signature).
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
