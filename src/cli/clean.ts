import CliCommand from './cli-command';
import { allApps } from '../apps/load-app';
import { removeFiles } from '../apps/common';

class CleanCommand extends CliCommand {
  constructor() {
    super('clean', 'clean build assets');
  }

  public async run(args) {
    args = args || {};
    const files = allApps().reduce((acc, a) => acc.concat(a.generatedFiles || []), []);
    const dir = args.dir || args.d || process.cwd();
    await removeFiles(dir, ['.pie'].concat(files));
    return files;
  }
}

export default new CleanCommand();
