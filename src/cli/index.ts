import * as _ from 'lodash';
import { Help } from './help';
import pack from './pack';
import serve from './serve';
import clean from './clean';
import manifest from './manifest';
import info from './info';
import version from './version';
import { readJsonSync, existsSync } from 'fs-extra';
import configuration from './configuration';
import { buildLogger } from 'log-factory';

import { normalizeOpts } from './helper';
import CliCommand from './cli-command';

const logger = buildLogger();

let commands: CliCommand[] = [
  pack,
  serve,
  clean,
  manifest,
  info,
  version
];

export const PIE_CONFIG = 'pie.config.json';

let loadConfig = (config?: string) => {
  config = config || PIE_CONFIG;
  return _.merge(configuration, existsSync(config) ? readJsonSync(config) : {});
}

export default function (opts) {

  opts = normalizeOpts(opts);
  logger.info('opts:', opts);
  opts.configuration = loadConfig(opts.config);

  logger.info('opts:', opts);

  let help: CliCommand = new Help('pie', commands);

  let cmd: CliCommand = _.find(([help]).concat(commands), (cmd) => {
    return cmd.match(opts);
  }) || help;

  let result = cmd.run(opts);

  return (result || Promise.resolve('done!'))
    .then((result) => {
      if (result) {
        console.log(result);
      }
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
};