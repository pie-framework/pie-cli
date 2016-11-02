import _ from 'lodash';
import Help from './help';
import * as version from './version';
import * as packQuestion from './pack-question';
import * as cleanQuestion from './clean-question';
import * as serveQuestion from './serve-question';

let commands = [
  version,
  packQuestion,
  cleanQuestion,
  serveQuestion
];

export default function (opts) {
  //bootstrap buildLogger 
  global.buildLogger = require('../log-factory').buildLogger;

  let help = new Help('pie-cli', commands);

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