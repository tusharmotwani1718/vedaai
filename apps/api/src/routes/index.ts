import { Router } from 'express';

import { evaluationRouter } from './evaluation.route';
import { healthRouter } from './health.route';

/**
 * Every API route is mounted here under the `/api` prefix by `createApp`.
 * Feature routers get added to this list as the app grows.
 */
export const apiRouter: Router = Router();

apiRouter.use(healthRouter);
apiRouter.use(evaluationRouter);
