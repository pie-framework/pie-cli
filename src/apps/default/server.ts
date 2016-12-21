import * as http from 'http';
import * as sockjs from 'sockjs';
import { ReloadOrError, HasServer } from '../server/types';
import { buildLogger } from '../../log-factory';
import * as express from 'express';

const logger = buildLogger();


export default class DefaultAppServer implements ReloadOrError, HasServer {

  static SOCK_PREFIX: string = '/sock'
  static SOCK_JS_URL: string = '//cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js';

  readonly httpServer;
  private _sockServer;
  private _connection;

  constructor(app: express.Application, sockJsUrl = DefaultAppServer.SOCK_JS_URL) {
    this.httpServer = http.createServer(app);
    this._sockServer = sockjs.createServer({
      sockjs_url: sockJsUrl
    });

    this._sockServer.on('connection', (conn) => {

      logger.silly('[DefaultAppServer] on - connection: ', (typeof conn));
      if (!conn) {
        return;
      }
      this._connection = conn;
    });

    this._sockServer.installHandlers(
      this.httpServer,
      { prefix: DefaultAppServer.SOCK_PREFIX }
    );
  }

  reload(name) {
    logger.debug('[DefaultAppServer] reload: name:', name);
    logger.silly('[DefaultAppServer] reload: connection', (typeof this._connection));
    if (this._connection) {
      this._connection.write(JSON.stringify({ type: 'reload' }));
    }
  }

  error(name, errors) {
    logger.debug('[DefaultAppServer] error: name:', name);
    logger.silly('[DefaultAppServer] error: connection: ', (typeof this._connection));
    if (this._connection) {
      this._connection.write(JSON.stringify({ type: 'error', errors: errors }));
    }
  }
}