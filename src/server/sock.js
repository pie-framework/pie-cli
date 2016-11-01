import sockjs from 'sockjs';
import { buildLogger } from '../log-factory';
const logger = buildLogger();

let connection = null;

export function init(server) {

  let sockServer = sockjs.createServer({
    sockjs_url: '//cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js'
  });

  sockServer.on('connection', function (conn) {

    if (!conn) {
      return;
    }

    connection = conn;
  });

  sockServer.installHandlers(server, { prefix: '/sock' });

  let reloadFn = (name) => {
    logger.silly(name, 'trigger a reload.');
    if (connection) {
      connection.write(JSON.stringify({ type: 'reload' }));
    }
  };

  let errorFn = (name, errors) => {
    logger.silly(name, 'trigger a reload.');
    if (connection) {
      connection.write(JSON.stringify({ type: 'error', errors: errors }));
    }
  }

  return { reload: reloadFn, error: errorFn };
}