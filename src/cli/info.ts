import { buildLogger } from '../log-factory';
import CliCommand from './cli-command';
import loadApp from '../apps/load-app';
import { App, ServeOpts } from '../apps/types';
import { startServer } from '../apps/server/utils';
import * as _ from 'lodash';

const logger = buildLogger();

class Cmd extends CliCommand {

  constructor() {
    super(
      'info',
      'run the info server'
    )
  }

  async run(args) {
    let a: App = await loadApp(_.merge(args, { app: 'info' }));
    let opts = ServeOpts.build(args);
    let {server, reload} = await a.server(opts);
    this.cliLogger.info('starting server...')
    await startServer(opts.port, server);
    return `server listening on ${opts.port}`;
  }
}

export default new Cmd();