import { buildLogger } from '../log-factory';
import CliCommand from './cli-command';

const logger = buildLogger();

class ManifestCommand extends CliCommand {
  constructor() {
    super('manifest', 'get a hash of the pie names and versions');
  }

  run(args) {

    logger.info('[run] args: ', args);
    return Promise.reject(new Error('todo...'));
  }
}

let cmd = new ManifestCommand();
exports.match = cmd.match.bind(cmd);
exports.usage = cmd.usage;
exports.summary = cmd.summary;
exports.run = cmd.run.bind(cmd);