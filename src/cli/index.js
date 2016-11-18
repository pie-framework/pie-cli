import _ from 'lodash';
import Help from './help';
import * as version from './version';
import * as packQuestion from './pack-question';
import * as cleanQuestion from './clean-question';
import * as serveQuestion from './serve-question';
import * as manifest from './manifest';
import {normalizeOpts} from './helper';
let commands = [
  version,
  packQuestion,
  cleanQuestion,
  serveQuestion,
  manifest
];

export default function (opts) {

  opts = normalizeOpts(opts);

  let help = new Help('pie', commands);

  let cmd = _.find([help].concat(commands), (cmd) => {
    return cmd.match(opts);
  }) || help;

  let result = cmd.run(opts);
  (result || Promise.resolve('done!'))
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