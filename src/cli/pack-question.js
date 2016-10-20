import { buildLogger } from '../log-factory';
import Question from '../question';
import Packer from '../question/packer';
import { resolve, join } from 'path';
import FrameworkSupport from '../framework-support';
import _ from 'lodash';
import CliCommand from './cli-command';

const logger = buildLogger();

class PackQuestionCommand extends CliCommand {

  constructor() {
    super(
      'pack-question',
      'generate a question package'
    )
  }

  run(args) {
    args.clean = args.clean === true || args.clean === 'true';
    logger.silly('args: ', args);

    let dir = resolve(args.dir || process.cwd());

    args.support = args.support || [];
    let support = _.isArray(args.support) ? args.support : [args.support];
    support = _.map(support, (s) => resolve(join(dir, s)));

    logger.silly('support: ', support);

    let frameworkSupport = FrameworkSupport.bootstrap(
      support.concat([
        join(__dirname, '../framework-support/frameworks/react'),
        join(__dirname, '../framework-support/frameworks/less')
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
}

let cmd = new PackQuestionCommand();
export let match = cmd.match.bind(cmd);
export let usage = cmd.usage;
export let summary = cmd.summary;
export let run = cmd.run.bind(cmd);