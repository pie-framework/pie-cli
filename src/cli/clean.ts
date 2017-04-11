import CliCommand from './cli-command';
import { clean } from '../apps/clean';
import report from './report';

class CleanCommand extends CliCommand {
  constructor() {
    super('clean', 'clean build assets', 'cleans pie files');
  }

  public async run(args) {
    args = args || {};
    const dir = args.dir || args.d || process.cwd();
    await report.promise('removing files', clean(dir));
    return {
      msg: 'clean complete'
    };
  }
}

export default new CleanCommand();
