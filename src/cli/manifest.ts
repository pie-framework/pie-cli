import { buildLogger } from 'log-factory';
import CliCommand from './cli-command';
import { writeJsonSync } from 'fs-extra';
import loadApp from '../apps/load-app';
import { App, ManifestOpts } from '../apps/types';
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
    let manifest = await a.manifest(opts);
    return JSON.stringify(manifest);
  }
}

export default new ManifestCommand();