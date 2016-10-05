import { buildLogger } from '../log-factory';
import Question from '../question';
import Packer, {DEFAULTS} from '../question/packer';
import path from 'path';
import FrameworkSupport from '../framework-support';

const logger = buildLogger();

var marked = require('marked');
var TerminalRenderer = require('marked-terminal');

export function match(args) {
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
 * \`${DEFAULTS.pieJs}\` - contains all the logic for rendering, includes the individual pies, a pie-player definition and ??
 * \`${DEFAULTS.controllersJs}\` - contains a map of pie names to their controllers, exports the map to either \`window\` or \`exports\`.

> Note: This doesn't generate the final question for you. To do that you'll need to create the final html page, include the 2 js files above, and use a controller that can interact with the controller-map.js file. See [pie-docs](http://pielabs.github.io/pie-docs) for more infomation.

### Options
  \`--support\` - an npm module or js file to load to add support for a build type. (NOT READY YET - don't use)
  \`--dir\` - the relative path to a directory to use as the root. This should contain \`config.json\` and \`index.html\` (default: the current working directory)
  \`--configFile\` - the name of the pie data file - default \`${DEFAULTS.configFile}\`
  \`--keepBuildAssets\` - keep supporting build assets (like node_modules etc) - default \`${DEFAULTS.keepBuildAssets}\`
  \`--dependenciesFile\` - the name of the dependencies file (to be removed) - default \`${DEFAULTS.dependenciesFile}\`
  \`--buildExample\` - build an example? - default \`${DEFAULTS.buildExample}\`
  \`--markupFile\` - if building an example - the name of the html file with the layout for the question. - default \`${DEFAULTS.markupFile}\`
  \`--exampleFile\` - if building an example - the name of the generated example html file.  - default \`${DEFAULTS.exampleFile}\`
### Examples
\`\`\`shell
pie-cli pack-question --dir ../path/to/dir 
\`\`\`
`);

export function run(args) {


  args.clean = args.clean !== 'false';
  logger.info('args: ', args);

  let dir = path.resolve(args.dir || process.cwd());

  let frameworkSupport = FrameworkSupport.bootstrap(
    (args.support || []).concat([
      path.join(__dirname, '../framework-support/frameworks/react')
    ]));

  logger.debug('frameworkSupport: ', frameworkSupport);
  let question = new Question(dir);
  let packer = new Packer(question, frameworkSupport);

  

  if (args.clean) {
    return packer.clean(args)
      .then(() => packer.pack(args));
  } else {
    return packer.pack(args);
  }
}
