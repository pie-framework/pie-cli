import { buildLogger } from '../log-factory';
import Question from '../question';
import Packer from '../question/packer';
import fs from 'fs-extra';
import path from 'path';
import FrameworkSupport from '../framework-support';
import _ from 'lodash';

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

console.log('>>', require.main.filename);
export let usage = marked(
  fs.readFileSync(path.join(require.main.filename, '../../docs/pack-question.md'), { encoding: 'utf8' }));

export function run(args) {

  args.clean = args.clean === 'true';
  logger.info('args: ', args);

  let dir = path.resolve(args.dir || process.cwd());

  args.support = args.support || [];
  let support = _.isArray(args.support) ? args.support : [args.support];
  support = _.map(support, (s) => path.resolve(path.join(dir, s)));

  logger.info('support: ', support);

  let frameworkSupport = FrameworkSupport.bootstrap(
    support.concat([
      path.join(__dirname, '../framework-support/frameworks/react'),
      path.join(__dirname, '../framework-support/frameworks/less')
    ]));

  logger.silly('[run] frameworkSupport: ', frameworkSupport);

  let question = new Question(dir);
  let packer = new Packer(question, frameworkSupport);


  if (args.clean) {
    return packer.clean(args)
      .then(() => packer.pack(args));
  } else {
    return packer.pack(args);
  }
}
