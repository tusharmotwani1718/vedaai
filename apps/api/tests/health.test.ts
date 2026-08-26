import { describe, expect, it } from 'bun:test';
import type { ApiResponse, HealthPayload } from '@vedaai/shared';

import { createApp } from '../src/app';

/**
 * The app is exercised through Bun's `fetch` against a throwaway server, which
 * keeps the test honest end-to-end (routing, JSON serialisation, status codes)
 * without pulling in supertest.
 */
async function withServer<T>(run: (baseUrl: string) => Promise<T>): Promise<T> {
  const server = createApp().listen(0);
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('Expected the test server to bind to a TCP port');
  }

  try {
    return await run(`http://127.0.0.1:${address.port}`);
  } finally {
    server.close();
  }
}

describe('GET /api/health', () => {
  it('reports the API as healthy', async () => {
    await withServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/health`);
      expect(res.status).toBe(200);

      const body = (await res.json()) as ApiResponse<HealthPayload>;
      expect(body.ok).toBe(true);
      if (!body.ok) return;

      expect(body.data.status).toBe('ok');
      expect(Number.isNaN(Date.parse(body.data.timestamp))).toBe(false);
      expect(body.data.uptimeSeconds).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('unknown routes', () => {
  it('returns a structured 404', async () => {
    await withServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/does-not-exist`);
      expect(res.status).toBe(404);

      const body = (await res.json()) as ApiResponse<never>;
      expect(body.ok).toBe(false);
      if (body.ok) return;

      expect(body.error.code).toBe('NOT_FOUND');
    });
  });
});
