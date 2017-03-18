import * as express from 'express';
import * as http from 'http';
import * as sockjs from 'sockjs';

import { HasServer, ReloadOrError } from './types';
import { linkCompilerToServer, startServer } from './utils';

import { buildLogger } from 'log-factory';

export { HasServer, ReloadOrError }

export { startServer, linkCompilerToServer }

const logger = buildLogger();

export default class AppServer implements ReloadOrError, HasServer {

  public static SOCK_PREFIX: string = '/sock';
  public static SOCK_JS_URL: string = '//cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js';

  readonly httpServer;
  private sockServer: any;
  private connection: any;

  constructor(app: express.Application, sockJsUrl = AppServer.SOCK_JS_URL) {
    this.httpServer = http.createServer(app);
    this.sockServer = sockjs.createServer({
      log: () => {
        // do nothing
      },
      sockjs_url: sockJsUrl
    });

    this.sockServer.on('connection', (conn) => {

      logger.silly('[DefaultAppServer] on - connection: ', (typeof conn));
      if (!conn) {
        return;
      }
      this.connection = conn;
    });

    this.sockServer.installHandlers(
      this.httpServer,
      { prefix: AppServer.SOCK_PREFIX }
    );
  }

  public reload(name) {
    logger.debug('[DefaultAppServer] reload: name:', name);
    logger.silly('[DefaultAppServer] reload: connection', (typeof this.connection));
    if (this.connection) {
      this.connection.write(JSON.stringify({ type: 'reload' }));
    }
  }

  public error(name, errors) {
    logger.debug('[DefaultAppServer] error: name:', name);
    logger.silly('[DefaultAppServer] error: connection: ', (typeof this.connection));
    if (this.connection) {
      this.connection.write(JSON.stringify({ type: 'error', errors }));
    }
  }
};
