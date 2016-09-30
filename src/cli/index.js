import _ from 'lodash';
import Help from './help';
import * as version from './version';
import * as packQuestion from './pack-question';
import * as cleanQuestion from './clean-question';

let commands = [
  version,
  packQuestion,
  cleanQuestion
];

export default function(opts){
  
  let help = new Help('pie-cli', commands);

  let cmd = _.find( [help].concat(commands), (cmd) => {
    return cmd.match(opts);
  }) || { run: () => Promise.reject(new Error(`can't find command for: ${opts}`))}
  let result = cmd.run(opts); 
  (result || Promise.resolve('done'))
    .then((result) => {
      console.log(result);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
};