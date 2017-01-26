import { buildLogger } from '../log-factory';
import CliCommand from './cli-command';
import loadApp from '../apps/load-app';
import { App, BuildOpts, ManifestOpts } from '../apps/types';

const logger = buildLogger();

class PackCommand extends CliCommand {
  constructor() {
    super('pack', 'generate a question package');
  }

  async run(args) {
    let a: App = await loadApp(args);
    let buildOpts = BuildOpts.build(args);
    let files = await a.build(buildOpts);
    this.cliLogger.info(`build files: ${files}`);
    this.cliLogger.info('build complete, run manifest...');

    if (buildOpts.createArchive) {
      this.cliLogger.info('creating archive...');
      let zip = await a.createArchive();
      this.cliLogger.info('archive: ', zip);
    }

    let manifestOpts = ManifestOpts.build(args);
    return a.manifest(manifestOpts);
  }
}

let cmd = new PackCommand();
export default cmd;
