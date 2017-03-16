import {
  types as apps,
  loadApp,
} from '../apps';

import CliCommand from './cli-command';
import { buildLogger } from 'log-factory';

const logger = buildLogger();

class PackCommand extends CliCommand {
  constructor() {
    super('pack', 'generate a question package');
  }

  public async run<T>(args) {
    const a: apps.App = await loadApp(args);

    if (apps.isBuildable<T>(a)) {
      const buildOpts = apps.BuildOpts.build(args);
      const result: T = await a.build(buildOpts);
      this.cliLogger.info('build complete, run manifest...');

      if (buildOpts.createArchive) {
        if (apps.isArchivable(a)) {
          this.cliLogger.info('creating archive...');
          const zip = await a.createArchive(result);
          this.cliLogger.info('archive: ', zip);
        } else {
          logger.warn('tried to create an archive but this app type isnt archivable');
        }
      }

      if (apps.isManifestable(a)) {
        const manifestOpts = apps.ManifestOpts.build(args);
        return a.manifest(manifestOpts);
      } else {
        return {};
      }

    } else {
      logger.warn('this app isnt buildable');
    }
  }
}

const cmd = new PackCommand();
export default cmd;
