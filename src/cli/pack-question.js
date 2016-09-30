import * as packer from '../question/packer';
import {fileLogger} from '../log-factory';
import path from 'path';

const logger = fileLogger(__filename);

var marked = require('marked');
var TerminalRenderer = require('marked-terminal');

export function match(args){
  return args._.indexOf('pack-question') !== -1;
}

export let summary = 'pack-question - generate a question package';

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
  \`--configFile\` - the name of the pie data file - default \`${packer.defaults.configFile}\`
  \`--dependenciesFile\` - the name of the dependencies file (to be removed) - default \`${packer.defaults.dependenciesFile}\`
  \`--buildExample\` - build an example? - default \`${packer.defaults.buildExample}\`
  \`--markupFile\` - if building an example - the name of the html file with the layout for the question. - default \`${packer.defaults.markupFile}\`
  \`--exampleFile\` - if building an example - the name of the generated example html file.  - default \`${packer.defaults.exampleFile}\`
### Examples
\`\`\`shell
pie-cli pack-question --dir ../path/to/dir 
\`\`\`
`);

export function run(args){
  args.clean = args.clean !== 'false';
  let dir = path.resolve(args.dir || process.cwd());

  if(args.clean){
     return packer.clean(dir).then(() => packer.build(dir, args));
   } else {
     return packer.build(dir);
   }
}
