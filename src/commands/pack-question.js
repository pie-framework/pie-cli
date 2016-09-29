import NpmDir from '../npm/npm-dir';
import Config from '../question/config';
import fs from 'fs-extra';
import path from 'path';
import _ from 'lodash';
import bundle from '../bundler/webpack';
import buildControllerMap from '../bundler/controller-map';

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

const ENTRY_JS = 'entry.js';

function writeEntryJs(root, pies){

    let pieRegistrationSrc = _.map(pies, (p, index) => `
import comp${index} from '${p}';
document.registerElement('${p}', comp${index});`).join('\n')
  
  let js = `
import PiePlayer from 'pie-player';
document.registerElement('pie-player', PiePlayer);
${pieRegistrationSrc}

import ClientSideController from 'pie-client-side-controller';
window.pie = window.pie || {};
window.pie.ClientSideController = ClientSideController;
`;

  return new Promise((resolve, reject) => {
    let entryPath = path.join(root, ENTRY_JS);
    fs.writeFile(path.join(root, ENTRY_JS), js, {encoding: 'utf8'}, (err) => {
      if(err){
        reject(err);
      } else {
        resolve(entryPath);
      }
    });
  });
}

function buildElementBundle(root, pies){
  return bundle(root, ENTRY_JS, pies);
}


export function run(args){
  let root = args.dir || process.cwd();
  logger.silly('root:', root);

  let npmDir = new NpmDir(root);

  let rawConfig = fs.readJsonSync(path.join(root, 'config.json'));
  let lookup = fs.readJsonSync(path.join(root, 'dependencies.json')) || {};
  let config = new Config(rawConfig, lookup);

  let npmDependencies = _.extend({}, config.npmDependencies, {
    'pie-player': 'PieLabs/pie-player',
    'pie-client-side-controller' : 'PieLabs/pie-client-side-controller',
    'babel-loader' : '^6.2.5',
    'babel-preset-es2015' : '^6.14.0',
    'babel-preset-react' : '^6.11.1'
  });

  fs.removeSync(path.join(root, ENTRY_JS));

  logger.silly('npm dependencies: ', npmDependencies);  
  return npmDir.freshInstall(npmDependencies)
    .then(() => writeEntryJs(root, _.keys(config.npmDependencies)))
    .then(() => buildElementBundle(root, _.keys(config.npmDependencies)))
    .then(() => buildControllerMap(root, 'config.json'))
    .then(() => logger.debug('npm install done'));
}
