import * as _ from 'lodash';

import { loadApp, types } from '../apps';

import CliCommand from './cli-command';
import { buildLogger } from 'log-factory';
import { init as initWatch } from '../watch/watchmaker';
import { startServer } from '../server';

const logger = buildLogger();

class Cmd extends CliCommand {

  constructor() {
    super(
      'info',
      'start a server and display the pie info page.'
    );
  }

  public async run(args) {
    const a: types.App = await loadApp(_.merge(args, { app: 'info' }));
    const opts = types.ServeOpts.build(args);

    if (types.isServable(a)) {
      const { server, reload, mappings, dirs } = await a.server(opts);
      this.cliLogger.info('starting server...');
      await startServer(opts.port, server);
      this.cliLogger.info('init watchers...');
      await initWatch(a.config, reload, a.watchableFiles(), mappings, dirs);
      return `server listening on ${opts.port}`;
    } else {
      logger.error('this app isnt servable');
      throw new Error('this app isnt servable');
    }
  }
}

export default new Cmd();
