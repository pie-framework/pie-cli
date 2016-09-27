import _ from 'lodash';
import Help from './help';
import * as version from './version';
import * as packQuestion from './commands/pack-question';

export default function(opts){
  
  let commands = [
    version,
    packQuestion 
  ];
  
  let help = new Help('pie-cli', commands);

  let cmd = _.find( [help].concat(commands), (cmd) => {
    return cmd.match(opts);
  }) || { run: () => console.error(`can't find command for: ${args}`)}
  cmd.run(opts);
};