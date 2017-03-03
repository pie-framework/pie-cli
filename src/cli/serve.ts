import * as _ from 'lodash';
import * as express from 'express';
import * as webpack from 'webpack';

import { App, Servable, ServeOpts, isServable } from '../apps/types';

import CliCommand from './cli-command';
import { buildLogger } from 'log-factory';
import { init as initWatch } from '../watch/watchmaker';
import loadApp from '../apps/load-app';
import { resolve } from 'path';
import { startServer } from '../server/utils';

const logger = buildLogger();

class Cmd extends CliCommand {

  constructor() {
    super(
      'serve',
      'run a dev server'
    )
  }

  async run(args) {

    // -> you must use the `item` app type.
    let a: App = await loadApp(_.extend(args, { app: 'item' }));
    let opts = ServeOpts.build(args);

    if (isServable(a)) {
      let { server, reload } = await a.server(opts);
      await startServer(opts.port, server);
      await initWatch(a.config, reload, []);
      return {
        msg: `server listening on ${opts.port}`,
        server: server
      }
    } else {
      logger.error('trying to serve an app that is not servable');
    }
  }
}

export default new Cmd();