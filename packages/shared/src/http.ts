/** Envelope every successful API response is wrapped in. */
export interface ApiSuccess<TData> {
  ok: true;
  data: TData;
}

/** Envelope every failed API response is wrapped in. */
export interface ApiFailure {
  ok: false;
  error: {
    /** Stable, machine-readable code (e.g. `NOT_FOUND`, `VALIDATION_ERROR`). */
    code: string;
    /** Human-readable message, safe to surface in the UI. */
    message: string;
  };
}

/** Discriminated union of every API response. Narrow on `ok`. */
export type ApiResponse<TData> = ApiSuccess<TData> | ApiFailure;

/** Payload of `GET /api/health`. */
export interface HealthPayload {
  status: 'ok';
  /** ISO-8601 timestamp of the moment the request was served. */
  timestamp: string;
  /** Seconds the API process has been running. */
  uptimeSeconds: number;
}
