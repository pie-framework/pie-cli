import CliCommand from './cli-command';
import { allApps } from '../apps/load-app';
import { removeFiles } from '../apps/common';
import report from './report';

class CleanCommand extends CliCommand {
  constructor() {
    super('clean', 'clean build assets', 'cleans pie files');
  }

  public async run(args) {
    args = args || {};
    const files = allApps().reduce((acc, a) => acc.concat(a.generatedFiles || []), []);
    const dir = args.dir || args.d || process.cwd();
    const allFiles = ['.pie'].concat(files);
    await removeFiles(dir, allFiles);
    report.info(`files ${allFiles.join(', ')}`);
    return {
      msg: 'clean complete'
    };
  }
}

export default new CleanCommand();
