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

    connection.on('close', function () {
      //connection.close();
    });

    conn.on('data', function (message) {
      conn.write(message);
    });
  });

  sockServer.installHandlers(server, { prefix: '/sock' });

  let reloadFn = () => {
    logger.info('trigger a reload...');
    if (connection) {
      connection.write('reload');
    }
  }
  logger.debug('reloadFn: ', reloadFn);
  return reloadFn;
}