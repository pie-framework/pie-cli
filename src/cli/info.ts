import * as _ from 'lodash';

import { App, ServeOpts, isServable } from '../apps/types';

import CliCommand from './cli-command';
import { buildLogger } from 'log-factory';
import { init as initWatch } from '../watch/watchmaker';
import loadApp from '../apps/load-app';
import { startServer } from '../server/utils';

const logger = buildLogger();

class Cmd extends CliCommand {

  constructor() {
    super(
      'info',
      'run the info server'
    );
  }

  public async run(args) {
    const a: App = await loadApp(_.merge(args, { app: 'info' }));
    const opts = ServeOpts.build(args);

    logger.debug('app: ', a);
    if (isServable(a)) {
      const { server, reload } = await a.server(opts);
      this.cliLogger.info('starting server...');
      await startServer(opts.port, server);
      this.cliLogger.info('init watchers...');
      await initWatch(a.config, reload, a.watchableFiles());
      return `server listening on ${opts.port}`;
    } else {
      logger.error('this app isnt servable');
      throw new Error('this app isnt servable');
    }
  }
}

export default new Cmd();