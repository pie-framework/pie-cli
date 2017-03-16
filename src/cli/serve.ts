import * as _ from 'lodash';

import { types as apps, loadApp } from '../apps';

import CliCommand from './cli-command';
import { buildLogger } from 'log-factory';
import { init as initWatch } from '../watch/watchmaker';
import { startServer } from '../server';

const logger = buildLogger();

class Cmd extends CliCommand {

  constructor() {
    super(
      'serve',
      'start a server and load the pie item.'
    );
  }

  public async run(args) {

    // -> you must use the `item` app type.
    const a: apps.App = await loadApp(_.extend(args, { app: 'item' }));
    const opts = apps.ServeOpts.build(args);

    if (apps.isServable(a)) {
      const { server, reload, mappings, dirs } = await a.server(opts);
      await startServer(opts.port, server);
      const extraFilesToWatch = [];
      await initWatch(a.config, reload, extraFilesToWatch, mappings, dirs);

      return {
        msg: `server listening on ${opts.port}`,
        server
      };

    } else {
      logger.error('trying to serve an app that is not servable');
    }
  }
}

export default new Cmd();
