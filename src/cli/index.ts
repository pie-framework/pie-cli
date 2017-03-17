import * as _ from 'lodash';

import CliCommand from './cli-command';
import { Help } from './help';
import { buildLogger } from 'log-factory';
import clean from './clean';
import info from './info';
import install from './install';
import manifest from './manifest';
import { normalizeOpts } from './helper';
import pack from './pack';
import serve from './serve';
import version from './version';

const logger = buildLogger();

const commands: CliCommand[] = [
  clean,
  info,
  install,
  manifest,
  pack,
  serve,
  version
];

export default function (opts) {

  opts = normalizeOpts(opts);

  logger.info('opts:', opts);

  const help: CliCommand = new Help('pie', commands);
  const allCmds = [help].concat(commands);
  const cmd: CliCommand = _.find(allCmds, c => c.match(opts)) || help;
  const result = cmd.run(opts);

  return (result || Promise.resolve('done!'))
    .then((r) => {
      if (r) {
        logger.info(r);
      }
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
