import { App, Archivable, BuildOpts, ManifestOpts, isArchivable, isBuildable } from '../apps/types';

import CliCommand from './cli-command';
import { buildLogger } from 'log-factory';
import loadApp from '../apps/load-app';

const logger = buildLogger();

class PackCommand extends CliCommand {
  constructor() {
    super('pack', 'generate a question package');
  }

  async run(args) {
    let a: App = await loadApp(args);

    if (isBuildable(a)) {
      let buildOpts = BuildOpts.build(args);
      let files = await a.build(buildOpts);
      this.cliLogger.info(`build files: ${files}`);
      this.cliLogger.info('build complete, run manifest...');

      if (buildOpts.createArchive) {
        if (isArchivable(a)) {
          this.cliLogger.info('creating archive...');
          let zip = await a.createArchive();
          this.cliLogger.info('archive: ', zip);
        } else {
          logger.warn('tried to create an archive but this app type isnt archivable');
        }
      }

      let manifestOpts = ManifestOpts.build(args);
      return a.manifest(manifestOpts);
    } else {
      logger.warn('this app isnt buildable');
    }
  }
}

let cmd = new PackCommand();
export default cmd;
