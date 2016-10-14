const marked = require('marked');
const TerminalRenderer = require('marked-terminal');
import Question from '../question';
import Packer from '../question/packer';
import path from 'path';
import {fileLogger} from '../log-factory';

let logger = fileLogger(__filename);

export function match(args){
  return args._.indexOf('clean-question') !== -1;
}

export let summary = 'clean-question - remove files generated by the `pack-question` command';

marked.setOptions({
  renderer: new TerminalRenderer()
});

export let usage = marked(`
# clean-question 
-----------------

Clean the cruft generated by pack-question 

### Examples 

\`\`\`shell 
pie-cli clean-question --dir ../path/to/dir

`);
 
export function run(args){

  logger.info('run...');
  let dir = path.resolve(args.dir || process.cwd());
  if(!dir){
    console.error('no dir in ' + args);
    return Promise.reject(new Error('no dir in ' + args)); 
  }

  let question = new Question(dir);
  let packer = new Packer(question, {});

  return packer.clean(dir, args)
    .then(() => "clean complete")
}