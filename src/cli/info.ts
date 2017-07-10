import * as _ from 'lodash';

import { clean, loadApp, types } from '../apps';

import CliCommand from './cli-command';
import { buildLogger } from 'log-factory';
import { init as initWatch } from '../watch/watchmaker';
import { join } from 'path';
import report from './report';
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

    if (opts.clean) {
      const dir = join(opts.dir, 'docs/demo');
      await report.promise('removing files', clean(dir));
    }

    if (types.isServable(a)) {
      const { server, reload, buildInfo, dirs } = await a.server(opts);
      await report.promise('starting server', startServer(opts.port, server));
      this.cliLogger.info('init watchers...');
      await report.promise('setting up file watching', new Promise(r => {
        initWatch(a.config, reload, a.watchableFiles(), buildInfo, dirs);
        r();
      }));
      return {
        msg: `server listening on ${opts.port}`
      };
    } else {
      logger.error('this app isnt servable');
      throw new Error('this app isnt servable');
    }
  }
}

export default new Cmd();
