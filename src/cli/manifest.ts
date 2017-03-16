import { types as apps, loadApp } from '../apps';

import CliCommand from './cli-command';
import { buildLogger } from 'log-factory';

const logger = buildLogger();

class ManifestCommand extends CliCommand {
  constructor() {
    super('manifest', 'get a hash of the pie names and versions');
  }

  public async run(args) {
    const opts = apps.ManifestOpts.build(args);
    logger.info('[run] opts: ', opts);
    const a: apps.App = await loadApp(args);
    logger.silly('[run] app: ', a);

    if (apps.isManifestable(a)) {
      const manifest = await a.manifest(opts);
      return JSON.stringify(manifest);
    } else {
      throw new Error('this app isnt buildable');
    }
  }
}

export default new ManifestCommand();
