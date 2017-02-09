import { buildLogger } from 'log-factory';
import CliCommand from './cli-command';
import loadApp from '../apps/load-app';
import { App } from '../apps/types';

const logger = buildLogger();

class CleanCommand extends CliCommand {
  constructor() {
    super('clean', 'clean build assets');
  }

  async run(args) {
    let a: App = await loadApp(args);
    return a.clean();
  }
}

export default new CleanCommand();