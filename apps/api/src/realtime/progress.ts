import type { Server as HttpServer } from 'node:http';

import { Server } from 'socket.io';
import {
  EVALUATION_PROGRESS_EVENT,
  EVALUATION_WATCH_EVENT,
  isValidUploadId,
  type EvaluationPhase,
  type EvaluationProgress,
} from '@vedaai/shared';

import { config } from '../config';

/**
 * Progress broadcasting for a running evaluation.
 *
 * The upload is one long HTTP request that answers only when the whole pipeline
 * is done. This is the side channel that tells the client which stage it is
 * currently waiting on.
 *
 * ## Why a room, and not the socket itself
 *
 * The obvious approach is to send `socket.id` up with the upload and emit
 * straight back to it. That breaks on reconnect: socket.io issues a new id
 * every time a connection drops, and a 30–120s upload gives a flaky network
 * plenty of opportunity. The server would carry on emitting to an id nobody
 * holds any more.
 *
 * So the client generates an `uploadId` before it uploads, joins a room named
 * after it, and sends the same id with the POST. A client that reconnects
 * rejoins the same room and picks the updates back up.
 */

let io: Server | null = null;

/** Rooms are namespaced so an upload id can never collide with anything else. */
function roomFor(uploadId: string): string {
  return `upload:${uploadId}`;
}

/**
 * Attaches the socket.io server to the same HTTP server Express is on.
 *
 * Sharing the port keeps the CORS story and the deployment story identical to
 * the REST API's — one origin to allow, one port to expose.
 */
export function attachProgressSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: config.corsOrigin },
  });

  io.on('connection', (socket) => {
    socket.on(EVALUATION_WATCH_EVENT, async (uploadId: unknown, ack?: () => void) => {
      // The id becomes a room name, so it is validated rather than trusted.
      // A bad one is ignored: the upload still runs, just without progress.
      if (isValidUploadId(uploadId)) await socket.join(roomFor(uploadId));

      // Acknowledged even when the id was rejected, so a client waiting on this
      // before it uploads is never left hanging by a bad id.
      ack?.();
    });
  });

  return io;
}

/**
 * Announces the stage the pipeline has just entered.
 *
 * Deliberately incapable of failing the caller. Progress is a convenience laid
 * over the upload, so an absent socket server, an upload with no id, or a
 * client that has gone away must all be no-ops rather than exceptions thrown
 * into the middle of a running evaluation.
 */
export function reportProgress(uploadId: string | undefined, phase: EvaluationPhase): void {
  if (io === null || uploadId === undefined) return;

  const payload: EvaluationProgress = { uploadId, phase };
  io.to(roomFor(uploadId)).emit(EVALUATION_PROGRESS_EVENT, payload);
}

/** Closes the socket server. Used by tests; production exits with the process. */
export async function closeProgressSocket(): Promise<void> {
  if (io === null) return;
  await io.close();
  io = null;
}
