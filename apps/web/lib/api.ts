import type { ApiResponse, HealthPayload } from '@vedaai/shared';

/**
 * Thin typed wrapper around `fetch` for talking to `@vedaai/api`.
 *
 * Every endpoint helper below funnels through `request`, so error handling and
 * the response envelope are unwrapped in exactly one place.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<TData>(path: string, init?: RequestInit): Promise<TData> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    // The API is entirely in-memory, so responses are never cacheable.
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  const body = (await res.json()) as ApiResponse<TData>;
  if (!body.ok) {
    throw new ApiError(body.error.code, body.error.message);
  }

  return body.data;
}

/** Returns the API health payload, or `null` when the API cannot be reached. */
export async function getHealth(): Promise<HealthPayload | null> {
  try {
    return await request<HealthPayload>('/api/health');
  } catch {
    return null;
  }
}
