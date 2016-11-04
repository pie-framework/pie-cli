import http from 'http';
import sockjs from 'sockjs';

import { buildLogger } from '../log-factory';

const logger = buildLogger();


export default class ExampleAppServer {

  static SOCK_PREFIX() {
    return '/sock'
  };

  static SOCK_JS_URL() {
    return '//cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js';
  }

  constructor(app, sockJsUrl = ExampleAppServer.SOCK_JS_URL()) {
    this._httpServer = http.createServer(app);
    this._sockServer = sockjs.createServer({
      sockjs_url: sockJsUrl
    });

    this._sockServer.on('connection', (conn) => {

      logger.silly('[ExampleAppServer] on - connection: ', (typeof conn));
      if (!conn) {
        return;
      }
      this._connection = conn;
    });

    this._sockServer.installHandlers(
      this._httpServer,
      { prefix: ExampleAppServer.SOCK_PREFIX() }
    );
  }

  on(key, handler) {
    this._httpServer.on(key, handler);
  }

  listen(port) {
    this._httpServer.listen(port);
  }

  reload(name) {
    logger.debug('[ExampleAppServer] reload: name:', name);
    logger.silly('[ExampleAppServer] reload: connection', (typeof this._connection));
    if (this._connection) {
      this._connection.write(JSON.stringify({ type: 'reload' }));
    }
  }

  error(name, errors) {
    logger.debug('[ExampleAppServer] error: name:', name);
    logger.silly('[ExampleAppServer] error: connection: ', (typeof this._connection));
    if (this._connection) {
      this._connection.write(JSON.stringify({ type: 'error', errors: errors }));
    }
  }
}