import { App, ManifestOpts, isBuildable } from '../apps/types';

import CliCommand from './cli-command';
import { buildLogger } from 'log-factory';
import loadApp from '../apps/load-app';
import { writeJsonSync } from 'fs-extra';
const logger = buildLogger();

class ManifestCommand extends CliCommand {
  constructor() {
    super('manifest', 'get a hash of the pie names and versions');
  }

  async run(args) {
    let opts = ManifestOpts.build(args);
    logger.info('[run] opts: ', opts);
    let a: App = await loadApp(args);
    logger.silly('[run] app: ', a);

    if (isBuildable(a)) {
      let manifest = await a.manifest(opts);
      return JSON.stringify(manifest);
    } else {
      throw new Error('this app isnt buildable');
    }
  }
}

export default new ManifestCommand();