import minimist from 'minimist';
import * as version from './version';
import * as mkPkg from './make-pkg';
import _ from 'lodash';
import Help from './help';

const commands = [
  version,
  mkPkg
];

const help = new Help('pie-cli', commands);

export default function(args){
  let obj = minimist(args);
  let cmd = _.find( [help].concat(commands), (cmd) => {
    return cmd.match(obj);
  }) || { run: () => console.error(`can't find command for: ${args}`)}
  cmd.run(obj);
};