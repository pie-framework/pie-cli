import * as express from 'express';
import { buildLogger } from 'log-factory';
import * as http from 'http';

const logger = buildLogger();

export function addView(app: express.Application, path: string): void {

  let views: string | string[] = app.get('views');

  if (Array.isArray(views)) {
    views.push(path);
  } else {
    views = [views, path];
  }
  app.set('views', views);
}

export let startServer = (port: number, server: http.Server) => new Promise((resolve, reject) => {
  server.on('error', (e) => {
    logger.error(e.message);
    logger.debug(e.stack);
    reject(e);
  });

  server.on('listening', () => {
    logger.silly(`[startServer] listening on ${port}`);
    resolve(server);
  });

  server.listen(port);
});
