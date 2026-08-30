/** Entry point: builds the app and starts listening. */

import { createServer } from 'node:http';

import { createApp } from './app';
import { config } from './config';
import { attachProgressSocket } from './realtime/progress';

// Express is no longer given the port directly: socket.io needs the underlying
// HTTP server so it can share it. One port, one origin to allow through CORS.
const httpServer = createServer(createApp());
attachProgressSocket(httpServer);

httpServer.listen(config.port, () => {
  console.log(`[api] listening on http://localhost:${config.port}`);
});
