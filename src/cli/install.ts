import * as _ from 'lodash';

import { FileNames, JsonConfig } from '../question/config';

import CliCommand from './cli-command';
import Install from '../install';

class Cmd extends CliCommand {

  constructor() {
    super(
      'install',
      'install the dependencies'
    );
  }

  public async run(args) {

    const dir = args.dir || args.d || process.cwd();
    const config = new JsonConfig(dir, FileNames.build(args));

    const i: Install = new Install(config);

    i.install(args.force === 'true' || args.force === true)
      .then(() => 'installed');
  }
}

export default new Cmd();
