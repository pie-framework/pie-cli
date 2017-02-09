import { buildLogger } from 'log-factory';
import CliCommand from './cli-command';
import { resolve } from 'path';
import * as webpack from 'webpack';
import * as express from 'express';
import loadApp from '../apps/load-app';
import { App, ServeOpts } from '../apps/types';
import { startServer } from '../apps/server/utils';
import { init as initWatch } from '../watch/watchmaker';

const logger = buildLogger();

class Cmd extends CliCommand {

  constructor() {
    super(
      'serve',
      'run a dev server'
    )
  }

  async run(args) {
    let a: App = await loadApp(args);
    let opts = ServeOpts.build(args);
    let {server, reload} = await a.server(opts);
    await startServer(opts.port, server);
    await initWatch(a.config, reload);
    return {
      msg: `server listening on ${opts.port}`,
      server: server
    }
  }
}

export default new Cmd();