import { buildLogger } from '../log-factory';
import Question from '../question/new';
import CliCommand from './cli-command';
import { build as buildMarkupExample } from '../code-gen/markup-example';
import { BuildOpts as ClientBuildOpts } from '../question/client';
import { BuildOpts as ControllersBuildOpts } from '../question/controllers';
import { resolve, join } from 'path';

const logger = buildLogger();

export class PackQuestionOpts {
  constructor(dir, clean, buildExample, exampleFile) {
    this.dir = dir;
    this.clean = clean;
    this.buildExample = buildExample;
    this.exampleFile = exampleFile;
  }

  static build(args) {
    return new PackQuestionOpts(args.dir || process.cwd(), args.clean === 'true' || args.clean === true, args.buildExample !== 'false' && args.buildExample !== false, args.exampleFile || 'example.html');
  }
}

class PackQuestionCommand extends CliCommand {
  constructor() {
    super('pack-question', 'generate a question package');
  }

  run(args) {
    let opts = PackQuestionOpts.build(args);
    let clientOpts = ClientBuildOpts.build(args);
    let controllerOpts = ControllersBuildOpts.build(args);
    let dir = resolve(opts.dir || process.cwd());
    let question = new Question(dir, clientOpts, controllerOpts);

    return question.pack(opts.clean)
      .then((result) => {
        logger.debug('pack result: ', result);
        if (opts.buildExample) {
          return buildMarkupExample(
            question.config,
            result.controllers, join(dir, opts.exampleFile)
          );
        }
      });
  }
}

let cmd = new PackQuestionCommand();
exports.match = cmd.match.bind(cmd);
exports.usage = cmd.usage;
exports.summary = cmd.summary;
exports.run = cmd.run.bind(cmd);