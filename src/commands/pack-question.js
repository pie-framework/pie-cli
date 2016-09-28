import NpmDir from '../npm/npm-dir';

export function match(args){
  return args._.indexOf('pack-question') !== -1;
}

import {fileLogger} from '../log-factory'; 

let logger = fileLogger(__filename);

export let summary = 'pack-question - generate a question package';

var marked = require('marked');
var TerminalRenderer = require('marked-terminal');

marked.setOptions({
  renderer: new TerminalRenderer()
});

export let usage = marked(`
# pack-question 
---
Generate some javascript for use in rendering the question.

It generates 2 javascript files: 
 * \`pie-bundle.js\` - contains all the logic for rendering, includes the individual pies, a pie-player definition and ??
 * \`controller-map.js\` - contains a map of pie names to their controllers, exports the map to either \`window\` or \`exports\`.

> Note: This doesn't generate the final question for you. To do that you'll need to create the final html page, include the 2 js files above, and use a controller that can interact with the controller-map.js file. See [pie-docs](http://pielabs.github.io/pie-docs) for more infomation.

### Options
  \`--dir\` - the relative path to a directory to use as the root. This should contain \`config.json\` and \`index.html\` (default: the current working directory)

### Examples
\`\`\`shell
pie-cli pack-question --dir ../path/to/dir 
\`\`\`
`);

export function run(args){
  let root = args.dir || process.cwd();
  logger.debug('...: root:', root);

  let npmDir = new NpmDir(root);

  /**  {name: location, ...} */
  let pies = args.pies || []; 
  
  return npmDir.freshInstall(pies)
    .then(() => logger.debug('npm install done'))
    .catch((e) => logger.error('error', e));
}
