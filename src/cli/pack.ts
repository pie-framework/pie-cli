import {
  types as apps,
  clean,
  loadApp,
} from '../apps';

import { BuildOpts } from "../apps/types";
import CliCommand from './cli-command';
import { buildLogger } from 'log-factory';
import report from './report';

const logger = buildLogger();

class PackCommand extends CliCommand {
  constructor() {
    super('pack', 'generate a question package');
  }

  public async run<T>(args) {
    const a: apps.App = await loadApp(args);

    if (apps.isBuildable<T, BuildOpts>(a)) {

      const buildOpts = a.buildOpts(args);

      if (buildOpts.clean) {
        await report.promise('removing files', clean(a.config.dir));
      }

      const result: T = await a.build(buildOpts);
      this.cliLogger.info('build complete, run manifest...');

      if (buildOpts.createArchive) {
        if (apps.isArchivable(a)) {
          this.cliLogger.info('creating archive...');
          const zip = await report.promise('creating archive', a.createArchive(result));
          this.cliLogger.info('archive: ', zip);
        } else {
          logger.warn('tried to create an archive but this app type isnt archivable');
        }
      }

      /**
       * TODO: Re-add manifest information
       * The idea of the manifest is to provide build information to the runner
       * so that they know if they need to run the command at all.
       * - however things have changed in 6.0.0+ which means we'll probably want to review what info we add.
       */

      return {
        msg: 'pack complete'
      };

    } else {
      logger.warn('this app isnt buildable');
    }
  }
}

const cmd = new PackCommand();
export default cmd;
