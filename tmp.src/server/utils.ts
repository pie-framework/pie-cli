import { Server } from './types';
import { buildLogger } from '../log-factory';
const logger = buildLogger();

export let startServer = (port: number, server: Server) => new Promise((resolve, reject) => {
  server.on('error', (e) => {
    logger.error(e);
    reject(e);
  });

  server.on('listening', () => {
    logger.silly(`[startServer] listening on ${port}`);
    resolve(server);
  });

  server.listen(port);
});
