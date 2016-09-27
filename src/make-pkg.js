export function match(args){
  return args._.indexOf('mk-pkg') !== -1;
}

export let summary = 'mk-pkg - generate a package';

var marked = require('marked');
var TerminalRenderer = require('marked-terminal');

marked.setOptions({
  renderer: new TerminalRenderer()
});

export let usage = marked(`
# mk-pkg
---
Generate some javascript for use in rendering the question.

It generates 2 javascript files: 
 * \`pie-bundle.js\` - contains all the logic for rendering, includes the individual pies, a pie-player definition and ??
 * \`controller-map.js\` - contains a map of pie names to their controllers, exports the map to either \`window\` or \`exports\`.

> Note: This doesn't generate the final question for you. To do that you'll need to create the final html page, include the 2 js files above, and use a controller that can interact with the controller-map.js file. See [pie-docs](http://pielabs.github.io/pie-docs) for more infomation.

### Options
  \`--dir\` - the relative path to a directory to use as the root. This should contain config.json and index.html (default: the current working directory)

### Examples
\`\`\`shell
pie-cli mk-pkg --dir x
\`\`\`
`);

export function run(args){
  process.exit(1);
}
