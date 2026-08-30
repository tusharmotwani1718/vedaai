import { io } from 'socket.io-client';
import {
  EVALUATION_PROGRESS_EVENT,
  EVALUATION_WATCH_EVENT,
  type EvaluationPhase,
  type EvaluationProgress,
} from '@vedaai/shared';

import { apiUrl } from './api';

/**
 * Live progress for a running upload.
 *
 * `POST /api/evaluations` answers once, at the end of a 30–120s pipeline. This
 * is the side channel that says which stage it is on in the meantime.
 *
 * Everything here is best-effort. A blocked WebSocket, a proxy that eats the
 * upgrade, an API that is not listening — none of them may stop a teacher
 * uploading a paper, so every failure path here ends in "no progress shown"
 * rather than an error.
 */

/**
 * How long the upload will wait for the socket before going ahead without it.
 *
 * The wait exists so the first stage is not emitted into an empty room. The cap
 * exists because progress is a convenience: if the socket cannot be reached,
 * the right outcome is an upload with no progress, not no upload.
 */
const CONNECT_GRACE_MS = 2000;

export interface ProgressWatch {
  /** Resolves once the server has this client in the room, or the grace period ends. */
  ready: Promise<void>;
  /** Closes the connection. Call it when the upload settles, either way. */
  dispose: () => void;
}

/**
 * Identifies one upload, generated before it starts.
 *
 * It cannot come from the server: the server has nothing to hand out until the
 * request it would name has already finished.
 */
export function newUploadId(): string {
  // randomUUID is only available in a secure context, which http:// on a LAN
  // address is not — so there is a fallback in the same format.
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8]! & 0x3f) | 0x80; // variant 1
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}

export function watchEvaluationProgress(
  uploadId: string,
  onPhase: (phase: EvaluationPhase) => void,
): ProgressWatch {
  const socket = io(apiUrl(''));

  let markReady = (): void => {};
  const ready = new Promise<void>((resolve) => {
    markReady = resolve;
  });

  // `on`, not `once`: a reconnect is a new session on the server, so the room
  // has to be rejoined every time the connection comes back up.
  socket.on('connect', () => {
    // Acknowledged rather than fire-and-forget. `ready` must not resolve until
    // the server has actually put this socket in the room, or the upload could
    // start first and have its opening stage emitted to nobody.
    socket.emit(EVALUATION_WATCH_EVENT, uploadId, markReady);
  });

  socket.on(EVALUATION_PROGRESS_EVENT, (progress: EvaluationProgress) => {
    if (progress?.uploadId === uploadId) onPhase(progress.phase);
  });

  setTimeout(markReady, CONNECT_GRACE_MS);

  return { ready, dispose: () => void socket.close() };
}
