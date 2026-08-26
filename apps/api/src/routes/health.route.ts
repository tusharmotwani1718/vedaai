import { Router } from 'express';
import type { ApiSuccess, HealthPayload } from '@vedaai/shared';

export const healthRouter: Router = Router();

/** GET /api/health — liveness probe, also used by the web app to verify wiring. */
healthRouter.get('/health', (_req, res) => {
  const body: ApiSuccess<HealthPayload> = {
    ok: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    },
  };
  res.json(body);
});
