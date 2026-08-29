import type { ApiResponse, EvaluationPayload, HealthPayload } from '@vedaai/shared';

/**
 * Thin typed wrapper around `fetch` for talking to `@vedaai/api`.
 *
 * Every endpoint helper below funnels through `request`, so error handling and
 * the response envelope are unwrapped in exactly one place.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** Absolute URL for a path the API handed us, e.g. a `DocumentPayload.url`. */
export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'ApiError';
  }
}

async function request<TData>(path: string, init?: RequestInit): Promise<TData> {
  // A FormData body must set its own Content-Type: the browser appends the
  // multipart boundary, and naming the type ourselves would strip it and leave
  // multer unable to parse the parts.
  const isForm = init?.body instanceof FormData;

  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      ...init,
      // The API is entirely in-memory, so responses are never cacheable.
      cache: 'no-store',
      headers: {
        ...(isForm ? {} : { 'Content-Type': 'application/json' }),
        ...init?.headers,
      },
    });
  } catch (cause) {
    // fetch only rejects when the request never completed — the API is down,
    // DNS failed, CORS blocked it. There is no response to read a code from.
    throw new ApiError(
      'NETWORK_ERROR',
      'Could not reach the server. Check that the API is running, then try again.',
      { cause },
    );
  }

  let body: ApiResponse<TData>;
  try {
    body = (await res.json()) as ApiResponse<TData>;
  } catch {
    // A non-JSON response means something between us and the route handler
    // answered — a proxy timeout, a crash before the error handler ran.
    throw new ApiError(
      'INVALID_RESPONSE',
      `The server returned an unreadable response (HTTP ${res.status}).`,
    );
  }

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

/**
 * Uploads both documents and runs the whole extraction pipeline.
 *
 * This is a long request, not a job submission: two OCR calls and two LLM calls
 * happen before it resolves, so 30–120s is normal and there is nothing to poll.
 * The caller is expected to hold a waiting state on screen for the duration.
 */
export async function createEvaluation(input: {
  questionPaper: File;
  answerSheet: File;
  signal?: AbortSignal;
}): Promise<EvaluationPayload> {
  const form = new FormData();
  form.append('questionPaper', input.questionPaper);
  form.append('answerSheet', input.answerSheet);

  return request<EvaluationPayload>('/api/evaluations', {
    method: 'POST',
    body: form,
    signal: input.signal,
  });
}

/**
 * Replays an already-processed evaluation. Nothing is re-run — this reads the
 * in-memory store — so it is cheap, but it only succeeds while the API process
 * that created the evaluation is still alive and has not evicted it.
 */
export async function getEvaluation(evaluationId: string): Promise<EvaluationPayload> {
  return request<EvaluationPayload>(`/api/evaluations/${encodeURIComponent(evaluationId)}`);
}
